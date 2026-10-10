import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Header from './components/Header';
import DashboardCards from './components/DashboardCards';
import MaterialTable from './components/MaterialTable';
import StockLogTable from './components/StockLogTable';

export default function App() {
  const [materials, setMaterials] = useState([]);
  const [logs, setLogs] = useState([]);
  const [bomRecipes, setBomRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  // 모바일 확인용 뷰 토글 상태 (true면 모바일 요약 카드 모드)
  const [mobileViewMode, setMobileViewMode] = useState(false);

  const [modalType, setModalType] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [quantity, setQuantity] = useState('');
  const [refNo, setRefNo] = useState('');

  const [selectedProduct, setSelectedProduct] = useState('');
  const [productQty, setProductQty] = useState('');
  const [bomRefNo, setBomRefNo] = useState('');
  const [currentBomList, setCurrentBomList] = useState([]);

  const [editingId, setEditingId] = useState(null);
  const [originalName, setOriginalName] = useState('');
  const [newMaterialName, setNewMaterialName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newCategory, setNewCategory] = useState('모듈');
  const [newStock, setNewStock] = useState('');
  const [newSafeStock, setNewSafeStock] = useState('');

  const [dynamicBomItems, setDynamicBomItems] = useState([{ materialName: '', qty: '' }]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const { data: materialData, error: materialError } = await supabase
        .from('materials')
        .select('*')
        .order('id', { ascending: true });

      if (materialError) throw materialError;

      const { data: logData, error: logError } = await supabase
        .from('stock_logs')
        .select('*')
        .order('id', { ascending: false });

      if (logError) throw logError;

      const { data: bomData, error: bomError } = await supabase
        .from('bom_recipes')
        .select('*');

      if (bomError) throw bomError;

      setMaterials(materialData || []);
      setLogs(logData || []);
      setBomRecipes(bomData || []);
    } catch (error) {
      console.error('데이터 로딩 에러:', error.message);
    } finally {
      setLoading(false);
    }
  }

  const productList = materials
    .filter(m => m.category === '완제품')
    .map(m => m.name);

  useEffect(() => {
    if (selectedProduct) {
      const items = bomRecipes.filter(b => b.product_name === selectedProduct);
      setCurrentBomList(items);
    } else {
      setCurrentBomList([]);
    }
  }, [selectedProduct, bomRecipes]);

  async function handleSubmitStock(e) {
    e.preventDefault();
    if (!selectedMaterial || !quantity || !refNo) {
      alert('모든 필드를 입력해 주세요.');
      return;
    }

    try {
      setSubmitting(true);
      const qtyNum = parseInt(quantity, 10);
      const targetMaterial = materials.find(m => m.name === selectedMaterial);

      if (!targetMaterial) {
        alert('존재하지 않는 자재입니다.');
        return;
      }

      let updatedStock = targetMaterial.stock;
      if (modalType === 'inbound') {
        updatedStock += qtyNum;
      } else {
        if (targetMaterial.stock < qtyNum) {
          alert('현재고가 부족하여 출고할 수 없습니다!');
          return;
        }
        updatedStock -= qtyNum;
      }

      const { error: updateError } = await supabase
        .from('materials')
        .update({ stock: updatedStock })
        .eq('id', targetMaterial.id);

      if (updateError) throw updateError;

      const today = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
      await supabase.from('stock_logs').insert([
        {
          date: today,
          type: modalType === 'inbound' ? '입고' : '출고',
          material_name: selectedMaterial,
          quantity: `${modalType === 'inbound' ? '+' : '-'}${qtyNum.toLocaleString()}`,
          remaining: updatedStock.toLocaleString(),
          ref: refNo,
          status: '완료'
        }
      ]);

      alert(`${modalType === 'inbound' ? '입고' : '출고'}가 성공적으로 처리되었습니다!`);
      setModalType(null);
      setSelectedMaterial('');
      setQuantity('');
      setRefNo('');
      fetchData();
    } catch (error) {
      console.error('처리 에러:', error.message);
      alert('처리에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBomOutbound(e) {
    e.preventDefault();
    if (!selectedProduct || !productQty || !bomRefNo) {
      alert('모든 필드를 입력해 주세요.');
      return;
    }

    const qtyMultiplier = parseInt(productQty, 10);
    if (qtyMultiplier <= 0) {
      alert('출고 수량은 1 이상이어야 합니다.');
      return;
    }

    for (const bom of currentBomList) {
      const targetMat = materials.find(m => m.name === bom.material_name);
      const requiredQty = bom.quantity_per_unit * qtyMultiplier;

      if (!targetMat) {
        alert(`필요 부자재 [${bom.material_name}]가 재고 목록에 존재하지 않습니다.`);
        return;
      }
      if (targetMat.stock < requiredQty) {
        alert(`[${targetMat.name}] 재고가 부족합니다! (현재고: ${targetMat.stock}개, 필요량: ${requiredQty}개)`);
        return;
      }
    }

    try {
      setSubmitting(true);
      const today = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });

      await supabase.from('stock_logs').insert([
        {
          date: today,
          type: '출고(완제품)',
          material_name: selectedProduct,
          quantity: `-${qtyMultiplier.toLocaleString()}`,
          remaining: '조립출고',
          ref: bomRefNo,
          status: '완료'
        }
      ]);

      for (const bom of currentBomList) {
        const targetMat = materials.find(m => m.name === bom.material_name);
        const requiredQty = bom.quantity_per_unit * qtyMultiplier;
        const newStock = targetMat.stock - requiredQty;

        const { error: updateError } = await supabase
          .from('materials')
          .update({ stock: newStock })
          .eq('id', targetMat.id);

        if (updateError) throw updateError;

        await supabase.from('stock_logs').insert([
          {
            date: today,
            type: '출고(BOM)',
            material_name: `${targetMat.name} (${selectedProduct} 부자재 소요)`,
            quantity: `-${requiredQty.toLocaleString()}`,
            remaining: newStock.toLocaleString(),
            ref: bomRefNo,
            status: '완료'
          }
        ]);
      }

      alert(`완제품 [${selectedProduct}] ${qtyMultiplier}개 생산/출고 및 하위 부자재 일괄 차감이 완료되었습니다!`);
      setModalType(null);
      setSelectedProduct('');
      setProductQty('');
      setBomRefNo('');
      fetchData();
    } catch (error) {
      console.error('BOM 출고 에러:', error.message);
      alert('BOM 출고 처리 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteLog(id) {
    if (!window.confirm("정말 이 입출고 내역을 삭제하시겠습니까?")) return;

    try {
      const { error } = await supabase
        .from('stock_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert("입출고 내역이 삭제되었습니다.");
      fetchData();
    } catch (error) {
      console.error("삭제 에러:", error.message);
      alert("삭제에 실패했습니다.");
    }
  }

  function addDynamicBomRow() {
    setDynamicBomItems([...dynamicBomItems, { materialName: '', qty: '' }]);
  }

  function removeDynamicBomRow(index) {
    const list = [...dynamicBomItems];
    list.splice(index, 1);
    setDynamicBomItems(list);
  }

  function handleDynamicBomChange(index, field, value) {
    const list = [...dynamicBomItems];
    list[index][field] = value;
    setDynamicBomItems(list);
  }

  async function handleSaveMaterial(e) {
    e.preventDefault();
    if (!newMaterialName || !newCode || !newCategory) {
      alert('필수 항목을 입력해 주세요.');
      return;
    }

    const isFinished = newCategory === '완제품';
    const stockVal = isFinished ? 0 : parseInt(newStock, 10);
    const safeStockVal = isFinished ? 0 : parseInt(newSafeStock, 10);

    if (!isFinished && (newStock === '' || newSafeStock === '')) {
      alert('자재의 현재 수량과 안전재고를 입력해 주세요.');
      return;
    }

    try {
      setSubmitting(true);

      if (modalType === 'editMaterial') {
        const { error } = await supabase
          .from('materials')
          .update({
            name: newMaterialName,
            code: newCode,
            category: newCategory,
            stock: stockVal,
            safe_stock: safeStockVal
          })
          .eq('id', editingId);

        if (error) throw error;

        if (isFinished) {
          await supabase.from('bom_recipes').delete().eq('product_name', originalName);

          const bomInserts = dynamicBomItems
            .filter(item => item.materialName && item.qty)
            .map(item => ({
              product_name: newMaterialName,
              material_name: item.materialName,
              quantity_per_unit: parseInt(item.qty, 10)
            }));

          if (bomInserts.length > 0) {
            const { error: bomError } = await supabase.from('bom_recipes').insert(bomInserts);
            if (bomError) throw bomError;
          }
        } else {
          await supabase.from('bom_recipes').delete().eq('product_name', originalName);
        }

        alert('자재 정보 및 레시피가 성공적으로 수정되었습니다!');
      } else {
        const { error: matError } = await supabase.from('materials').insert([
          {
            name: newMaterialName,
            code: newCode,
            category: newCategory,
            stock: stockVal,
            safe_stock: safeStockVal
          }
        ]);

        if (matError) throw matError;

        if (isFinished && dynamicBomItems.length > 0) {
          const bomInserts = dynamicBomItems
            .filter(item => item.materialName && item.qty)
            .map(item => ({
              product_name: newMaterialName,
              material_name: item.materialName,
              quantity_per_unit: parseInt(item.qty, 10)
            }));

          if (bomInserts.length > 0) {
            const { error: bomError } = await supabase.from('bom_recipes').insert(bomInserts);
            if (bomError) throw bomError;
          }
        }
        alert('신규 품목이 성공적으로 등록되었습니다!');
      }

      setModalType(null);
      resetMaterialForm();
      fetchData();
    } catch (error) {
      console.error('저장 에러:', error.message);
      alert('저장에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteMaterial(id, name, category) {
    if (!window.confirm(`정말 [${name}] 품목을 삭제하시겠습니까?`)) return;

    try {
      const { error } = await supabase.from('materials').delete().eq('id', id);
      if (error) throw error;

      if (category === '완제품') {
        await supabase.from('bom_recipes').delete().eq('product_name', name);
      }

      alert('품목이 삭제되었습니다.');
      fetchData();
    } catch (error) {
      console.error('삭제 에러:', error.message);
      alert('삭제에 실패했습니다.');
    }
  }

  function openEditModal(item) {
    setEditingId(item.id);
    setOriginalName(item.name);
    setNewMaterialName(item.name);
    setNewCode(item.code || item.sku || '');
    setNewCategory(item.category || '모듈');
    setNewStock(item.stock);
    setNewSafeStock(item.safe_stock ?? 1000);

    if (item.category === '완제품') {
      const existingBom = bomRecipes
        .filter(b => b.product_name === item.name)
        .map(b => ({ materialName: b.material_name, qty: b.quantity_per_unit }));
      
      setDynamicBomItems(existingBom.length > 0 ? existingBom : [{ materialName: '', qty: '' }]);
    } else {
      setDynamicBomItems([{ materialName: '', qty: '' }]);
    }

    setModalType('editMaterial');
  }

  function resetMaterialForm() {
    setEditingId(null);
    setOriginalName('');
    setNewMaterialName('');
    setNewCode('');
    setNewCategory('모듈');
    setNewStock('');
    setNewSafeStock('');
    setDynamicBomItems([{ materialName: '', qty: '' }]);
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-white">
        <p className="text-base font-semibold tracking-wide animate-pulse">기흥 ERP 시스템 로딩 중...</p>
      </div>
    );
  }

  // 부족 자재 목록 계산
  const shortageItems = materials.filter(m => 
    m.category !== '완제품' && (m.stock ?? 0) < (m.safe_stock ?? 1000)
  );

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-800 overflow-hidden">
      <div className="flex-1 flex flex-col overflow-y-auto relative w-full">
        <Header />
        
        <main className="p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* 상단 타이틀 및 액션 버튼 그룹 */}
          <div className="flex justify-between items-center flex-wrap gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Smart Factory ERP
              </span>
              <h1 className="text-2xl font-black text-slate-900 mt-2">기흥 LED 조명 자재 관리</h1>
              <p className="text-xs text-slate-400 mt-0.5">완제품 조립 생산 및 자재 입출고 통합 관리 시스템</p>
            </div>
            
            <div className="flex gap-2.5 flex-wrap items-center">
              {/* 모바일 확인용 뷰 토글 버튼 */}
              <button 
                onClick={() => setMobileViewMode(!mobileViewMode)}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs transition shadow-sm cursor-pointer flex items-center gap-1.5 ${
                  mobileViewMode ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>📱 모바일 확인용 요약 뷰 {mobileViewMode ? 'ON' : 'OFF'}</span>
              </button>

              <button 
                onClick={() => { resetMaterialForm(); setModalType('addMaterial'); }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold text-xs transition shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <span>✨ 신규 등록</span>
              </button>
              <button 
                onClick={() => setModalType('bomOutbound')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-semibold text-xs transition shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <span>📦 완제품 일괄 출고</span>
              </button>
              <button 
                onClick={() => setModalType('outbound')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold text-xs transition shadow-md shadow-blue-600/20 active:scale-95 cursor-pointer"
              >
                + 단품 출고
              </button>
              <button 
                onClick={() => setModalType('inbound')}
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-semibold text-xs transition shadow-md shadow-slate-900/20 active:scale-95 cursor-pointer"
              >
                + 단품 입고
              </button>
            </div>
          </div>

          {/* 📱 모바일 확인용 요약 뷰 토글이 켜졌을 때 보여줄 카드 전용 화면 */}
          {mobileViewMode ? (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-indigo-900">📱 모바일 확인용 요약 모드 활성화됨</h3>
                  <p className="text-xs text-indigo-700 mt-0.5">현장 스마트폰 화면에서 스크롤 부담 없이 핵심 재고만 한눈에 확인합니다.</p>
                </div>
                <button 
                  onClick={() => setMobileViewMode(false)}
                  className="bg-white text-indigo-700 font-bold text-xs px-3 py-1.5 rounded-xl shadow-xs hover:bg-indigo-100 transition cursor-pointer"
                >
                  기본 화면으로 돌아가기
                </button>
              </div>

              {/* 1. 재고 부족 요약 */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <span className="text-[11px] font-bold text-rose-500 bg-rose-50 px-2.5 py-0.5 rounded-full uppercase">Alert Summary</span>
                <h3 className="text-base font-extrabold text-slate-900 mt-2">🚨 긴급 발주 필요 품목 ({shortageItems.length}개)</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {shortageItems.length > 0 ? (
                    shortageItems.map((item, i) => (
                      <div key={i} className="bg-rose-50 border border-rose-100 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700">
                        {item.name} <span className="text-rose-500 font-normal ml-1">({item.stock}개 남음)</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">현재 부족한 자재가 없습니다.</p>
                  )}
                </div>
              </div>

              {/* 2. 전체 자재 현재고 요약 카드 리스트 */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full uppercase">Stock Summary</span>
                <h3 className="text-base font-extrabold text-slate-900 mt-2">📦 자재 및 완제품 현재 수량 요약</h3>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {materials.map((m, i) => (
                    <div key={i} className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex justify-between items-center">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">{m.name}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{m.code} ({m.category})</span>
                      </div>
                      <div className="text-right">
                        {m.category === '완제품' ? (
                          <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">조립형</span>
                        ) : (
                          <span className={`text-sm font-black ${(m.stock ?? 0) < (m.safe_stock ?? 1000) ? 'text-rose-600' : 'text-slate-900'}`}>
                            {(m.stock ?? 0).toLocaleString()}개
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. 최근 입출고 내역 요약 */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full uppercase">Log Summary</span>
                <h3 className="text-base font-extrabold text-slate-900 mt-2">📋 최근 변동 내역 (최근 5건)</h3>
                <div className="mt-4 space-y-2">
                  {logs.slice(0, 5).map((log, i) => (
                    <div key={i} className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex justify-between items-center text-xs">
                      <div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold mr-2 ${
                          log.type === '입고' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}>{log.type}</span>
                        <span className="font-bold text-slate-800">{log.material_name}</span>
                      </div>
                      <div className="text-right">
                        <span className={`font-bold ${log.type === '입고' ? 'text-emerald-600' : 'text-rose-600'}`}>{log.quantity}</span>
                        <span className="text-slate-400 text-[10px] block">{log.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // PC 기본 대시보드 화면
            <>
              <DashboardCards materials={materials} />
              <MaterialTable materials={materials} bomRecipes={bomRecipes} onEdit={openEditModal} onDelete={(id, name) => {
                const item = materials.find(m => m.id === id);
                handleDeleteMaterial(id, name, item?.category);
              }} />
              <StockLogTable logs={logs} onDeleteLog={handleDeleteLog} />
            </>
          )}
        </main>

        {modalType && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg p-6 space-y-5 animate-fade-in max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-900">
                  {modalType === 'inbound' && '📦 신규 자재 입고 등록'}
                  {modalType === 'outbound' && '🚚 단품 자재 출고 등록'}
                  {modalType === 'bomOutbound' && '📦 완제품 BOM 일괄 출고'}
                  {modalType === 'addMaterial' && '✨ 신규 자재 및 완제품 품목 등록'}
                  {modalType === 'editMaterial' && '✏️ 자재 및 레시피 정보 수정'}
                </h3>
                <button 
                  onClick={() => setModalType(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-lg w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
                >
                  &times;
                </button>
              </div>

              {modalType === 'bomOutbound' ? (
                <form onSubmit={handleBomOutbound} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">출고할 완제품 선택</label>
                    <select 
                      value={selectedProduct} 
                      onChange={(e) => setSelectedProduct(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                      required
                    >
                      <option value="">완제품을 선택하세요</option>
                      {productList.map((prod, idx) => (
                        <option key={idx} value={prod}>{prod}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">출고 수량 (완제품 기준)</label>
                    <input 
                      type="number" 
                      placeholder="예: 10" 
                      value={productQty}
                      onChange={(e) => setProductQty(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">참조 번호 (Ref)</label>
                    <input 
                      type="text" 
                      placeholder="예: #PROJ-BOM-001" 
                      value={bomRefNo}
                      onChange={(e) => setBomRefNo(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    />
                  </div>

                  {selectedProduct && (
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 space-y-2">
                      <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                        🔍 하위 부자재 소요량 미리보기 (BOM Preview)
                      </h4>
                      <div className="divide-y divide-indigo-100 text-xs">
                        {currentBomList.map((bom, i) => {
                          const targetMat = materials.find(m => m.name === bom.material_name);
                          const currentStock = targetMat ? targetMat.stock : 0;
                          const req = bom.quantity_per_unit * (parseInt(productQty) || 0);
                          const isLack = currentStock < req;

                          return (
                            <div key={i} className="py-2.5 flex justify-between items-center">
                              <div>
                                <span className="font-semibold text-slate-800">{bom.material_name}</span>
                                <span className="text-slate-500 ml-1">(개당 {bom.quantity_per_unit}개 소요)</span>
                              </div>
                              <div className="text-right">
                                <span className={`font-bold ${isLack ? 'text-red-600' : 'text-indigo-600'}`}>
                                  -{req.toLocaleString()}개 차감
                                </span>
                                <span className="text-slate-400 block text-[10px]">
                                  현재고: {currentStock.toLocaleString()}개
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                    <button type="button" onClick={() => setModalType(null)} className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer">취소</button>
                    <button type="submit" disabled={submitting} className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-md shadow-indigo-600/20 cursor-pointer">{submitting ? '처리 중...' : '완제품 출고 실행'}</button>
                  </div>
                </form>
              ) : modalType === 'addMaterial' || modalType === 'editMaterial' ? (
                <form onSubmit={handleSaveMaterial} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">분류 선택</label>
                    <select 
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer font-bold text-emerald-700"
                      required
                    >
                      <option value="모듈">자재 - 모듈</option>
                      <option value="전원장치">자재 - 전원장치</option>
                      <option value="부자재">자재 - 부자재</option>
                      <option value="완제품">완제품 (조립형)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      {newCategory === '완제품' ? '완제품명' : '자재명'}
                    </label>
                    <input 
                      type="text" 
                      placeholder={newCategory === '완제품' ? "예: LED 다운라이트 6인치" : "예: LED 칩셋 A타입"} 
                      value={newMaterialName}
                      onChange={(e) => setNewMaterialName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">품목코드 (SKU/Code)</label>
                    <input 
                      type="text" 
                      placeholder="예: DL-6INCH-01" 
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      required
                    />
                  </div>

                  {newCategory !== '완제품' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">현재 수량</label>
                        <input 
                          type="number" 
                          placeholder="0" 
                          value={newStock}
                          onChange={(e) => setNewStock(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">안전재고</label>
                        <input 
                          type="number" 
                          placeholder="1000" 
                          value={newSafeStock}
                          onChange={(e) => setNewSafeStock(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {newCategory === '완제품' && (
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                          🛠️ 완제품 구성 부자재 (BOM 레시피) 설정
                        </label>
                        <button 
                          type="button"
                          onClick={addDynamicBomRow}
                          className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition shadow-sm cursor-pointer"
                        >
                          + 부자재 추가
                        </button>
                      </div>

                      <div className="space-y-2">
                        {dynamicBomItems.map((item, index) => (
                          <div key={index} className="flex gap-2 items-center">
                            <select 
                              value={item.materialName}
                              onChange={(e) => handleDynamicBomChange(index, 'materialName', e.target.value)}
                              className="flex-1 bg-white border border-slate-200 rounded-xl p-2.5 text-xs outline-none cursor-pointer"
                            >
                              <option value="">부자재 선택</option>
                              {materials.filter(m => m.category !== '완제품').map((m) => (
                                <option key={m.id} value={m.name}>{m.name}</option>
                              ))}
                            </select>
                            <input 
                              type="number" 
                              placeholder="소요수량" 
                              value={item.qty}
                              onChange={(e) => handleDynamicBomChange(index, 'qty', e.target.value)}
                              className="w-24 bg-white border border-slate-200 rounded-xl p-2.5 text-xs outline-none"
                            />
                            {dynamicBomItems.length > 1 && (
                              <button 
                                type="button"
                                onClick={() => removeDynamicBomRow(index)}
                                className="text-red-400 hover:text-red-600 font-bold px-1.5 text-base cursor-pointer"
                              >
                                &times;
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                    <button type="button" onClick={() => setModalType(null)} className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer">취소</button>
                    <button type="submit" disabled={submitting} className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-md shadow-emerald-600/20 cursor-pointer">{submitting ? '저장 중...' : '저장하기'}</button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSubmitStock} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">자재 선택</label>
                    <select 
                      value={selectedMaterial} 
                      onChange={(e) => setSelectedMaterial(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                      required
                    >
                      <option value="">자재를 선택하세요</option>
                      {materials.filter(m => m.category !== '완제품').length > 0 ? (
                        materials.filter(m => m.category !== '완제품').map((m) => (
                          <option key={m.id} value={m.name}>
                            {m.name} ({m.category} / 현재고: {(m.stock ?? 0).toLocaleString()}개)
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>등록된 자재가 없습니다</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">수량</label>
                    <input 
                      type="number" 
                      placeholder="수량을 입력하세요 (예: 1000)" 
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">참조 번호 (Ref)</label>
                    <input 
                      type="text" 
                      placeholder="예: #RM1026A" 
                      value={refNo}
                      onChange={(e) => setRefNo(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                    <button type="button" onClick={() => setModalType(null)} className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer">취소</button>
                    <button type="submit" disabled={submitting} className={`px-5 py-2.5 rounded-xl text-xs font-semibold text-white transition shadow-md cursor-pointer ${modalType === 'inbound' ? 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'}`}>
                      {submitting ? '처리 중...' : '등록하기'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}