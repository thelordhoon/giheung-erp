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

  // 모달 상태 ('inbound' | 'outbound' | 'bomOutbound' | 'addMaterial' | 'editMaterial' | null)
  const [modalType, setModalType] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [quantity, setQuantity] = useState('');
  const [refNo, setRefNo] = useState('');

  // 완제품 BOM 출고 상태
  const [selectedProduct, setSelectedProduct] = useState('');
  const [productQty, setProductQty] = useState('');
  const [bomRefNo, setBomRefNo] = useState('');
  const [currentBomList, setCurrentBomList] = useState([]);

  // 신규/수정 자재 폼 상태
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

  const productList = [...new Set(bomRecipes.map(b => b.product_name))];

  useEffect(() => {
    if (selectedProduct) {
      const items = bomRecipes.filter(b => b.product_name === selectedProduct);
      setCurrentBomList(items);
    } else {
      setCurrentBomList([]);
    }
  }, [selectedProduct, bomRecipes]);

  // 단품 입출고 처리
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

  // 완제품 BOM 일괄 출고 처리 (완제품 재고 차감 + 하위 부자재 동시 차감)
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

    const targetProductMat = materials.find(m => m.name === selectedProduct);
    if (!targetProductMat) {
      alert('선택한 완제품이 자재 재고 목록에 존재하지 않습니다.');
      return;
    }
    if (targetProductMat.stock < qtyMultiplier) {
      alert(`완제품 [${selectedProduct}]의 현재고가 부족합니다! (현재고: ${targetProductMat.stock}개, 출고 요청량: ${qtyMultiplier}개)`);
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

      // 완제품 자체 재고 차감 및 로그 기록
      const newProductStock = targetProductMat.stock - qtyMultiplier;
      const { error: prodUpdateError } = await supabase
        .from('materials')
        .update({ stock: newProductStock })
        .eq('id', targetProductMat.id);

      if (prodUpdateError) throw prodUpdateError;

      await supabase.from('stock_logs').insert([
        {
          date: today,
          type: '출고(완제품)',
          material_name: selectedProduct,
          quantity: `-${qtyMultiplier.toLocaleString()}`,
          remaining: newProductStock.toLocaleString(),
          ref: bomRefNo,
          status: '완료'
        }
      ]);

      // 각 하위 부자재 재고 차감 및 로그 기록
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

      alert(`완제품 [${selectedProduct}] ${qtyMultiplier}개 및 하위 부자재 일괄 차감이 완료되었습니다!`);
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

  // 입출고 내역 삭제 (확인창 후 바로 삭제)
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
    if (!newMaterialName || !newCode || !newCategory || newStock === '' || newSafeStock === '') {
      alert('모든 항목을 입력해 주세요.');
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
            stock: parseInt(newStock, 10),
            safe_stock: parseInt(newSafeStock, 10)
          })
          .eq('id', editingId);

        if (error) throw error;

        if (newCategory === '완제품') {
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
            stock: parseInt(newStock, 10),
            safe_stock: parseInt(newSafeStock, 10)
          }
        ]);

        if (matError) throw matError;

        if (newCategory === '완제품' && dynamicBomItems.length > 0) {
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
    if (!window.confirm(`정말 [${name}] 자재를 삭제하시겠습니까?`)) return;

    try {
      const { error } = await supabase.from('materials').delete().eq('id', id);
      if (error) throw error;

      if (category === '완제품') {
        await supabase.from('bom_recipes').delete().eq('product_name', name);
      }

      alert('자재가 삭제되었습니다.');
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
        <p className="text-lg font-medium animate-pulse">기흥 ERP 데이터 로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden">
      <div className="flex-1 flex flex-col overflow-y-auto relative w-full">
        <Header />
        
        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <h1 className="text-xl font-bold text-slate-900">기흥 조명 자재 관리 ERP</h1>
            <div className="flex gap-3 flex-wrap">
              <button 
                onClick={() => { resetMaterialForm(); setModalType('addMaterial'); }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition shadow-sm cursor-pointer"
              >
                + 신규 자재/완제품 등록
              </button>
              <button 
                onClick={() => setModalType('bomOutbound')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition shadow-sm cursor-pointer"
              >
                📦 완제품 일괄 출고
              </button>
              <button 
                onClick={() => setModalType('outbound')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition shadow-sm cursor-pointer"
              >
                + 단품 출고
              </button>
              <button 
                onClick={() => setModalType('inbound')}
                className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-medium text-sm transition shadow-sm cursor-pointer"
              >
                + 단품 입고
              </button>
            </div>
          </div>

         <DashboardCards materials={materials} />
          <MaterialTable materials={materials} onEdit={openEditModal} onDelete={(id, name) => {
            const item = materials.find(m => m.id === id);
            handleDeleteMaterial(id, name, item?.category);
          }} />
          
          {/* 전체 입출고 내역 스크롤 지원 및 삭제 기능 연동 */}
          <StockLogTable logs={logs} onDeleteLog={handleDeleteLog} />
        </main>

        {modalType && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 animate-fade-in max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-lg font-bold text-slate-900">
                  {modalType === 'inbound' && '📦 신규 자재 입고 등록'}
                  {modalType === 'outbound' && '🚚 단품 자재 출고 등록'}
                  {modalType === 'bomOutbound' && '📦 완제품 BOM 일괄 출고'}
                  {modalType === 'addMaterial' && '✨ 신규 자재 및 완제품 품목 등록'}
                  {modalType === 'editMaterial' && '✏️ 자재 및 레시피 정보 수정'}
                </h3>
                <button 
                  onClick={() => setModalType(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-xl cursor-pointer"
                >
                  &times;
                </button>
              </div>

              {modalType === 'bomOutbound' ? (
                <form onSubmit={handleBomOutbound} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">출고할 완제품 선택</label>
                    <select 
                      value={selectedProduct} 
                      onChange={(e) => setSelectedProduct(e.target.value)}
                      className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white cursor-pointer"
                      required
                    >
                      <option value="">완제품을 선택하세요</option>
                      {productList.map((prod, idx) => (
                        <option key={idx} value={prod}>{prod}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">출고 수량 (완제품 기준)</label>
                    <input 
                      type="number" 
                      placeholder="예: 10" 
                      value={productQty}
                      onChange={(e) => setProductQty(e.target.value)}
                      className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">참조 번호 (Ref)</label>
                    <input 
                      type="text" 
                      placeholder="예: #PROJ-BOM-001" 
                      value={bomRefNo}
                      onChange={(e) => setBomRefNo(e.target.value)}
                      className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    />
                  </div>

                  {selectedProduct && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                      <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                        🔍 하위 부자재 소요량 미리보기 (BOM Preview)
                      </h4>
                      <div className="divide-y divide-slate-200 text-xs">
                        {currentBomList.map((bom, i) => {
                          const targetMat = materials.find(m => m.name === bom.material_name);
                          const currentStock = targetMat ? targetMat.stock : 0;
                          const req = bom.quantity_per_unit * (parseInt(productQty) || 0);
                          const isLack = currentStock < req;

                          return (
                            <div key={i} className="py-2 flex justify-between items-center">
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

                  <div className="flex justify-end gap-2 pt-3 border-t">
                    <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition cursor-pointer">취소</button>
                    <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg text-sm text-white bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer">{submitting ? '처리 중...' : '완제품 출고 실행'}</button>
                  </div>
                </form>
              ) : modalType === 'addMaterial' || modalType === 'editMaterial' ? (
                <form onSubmit={handleSaveMaterial} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">품목명 (자재명 또는 완제품명)</label>
                    <input 
                      type="text" 
                      placeholder="예: LED 다운라이트 6인치" 
                      value={newMaterialName}
                      onChange={(e) => setNewMaterialName(e.target.value)}
                      className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">품목코드 (Code)</label>
                      <input 
                        type="text" 
                        placeholder="예: DL-6INCH-01" 
                        value={newCode}
                        onChange={(e) => setNewCode(e.target.value)}
                        className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">분류 선택</label>
                      <select 
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white cursor-pointer"
                        required
                      >
                        <option value="모듈">모듈</option>
                        <option value="전원장치">전원장치</option>
                        <option value="부자재">부자재</option>
                        <option value="완제품">완제품</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">현재 수량</label>
                      <input 
                        type="number" 
                        placeholder="0" 
                        value={newStock}
                        onChange={(e) => setNewStock(e.target.value)}
                        className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">안전재고</label>
                      <input 
                        type="number" 
                        placeholder="1000" 
                        value={newSafeStock}
                        onChange={(e) => setNewSafeStock(e.target.value)}
                        className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        required
                      />
                    </div>
                  </div>

                  {newCategory === '완제품' && (
                    <div className="bg-emerald-50/50 border border-emerald-200 rounded-lg p-3 space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                          🛠️ 완제품 구성 부자재 (BOM 레시피) 설정
                        </label>
                        <button 
                          type="button"
                          onClick={addDynamicBomRow}
                          className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded transition cursor-pointer"
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
                              className="flex-1 border rounded-lg p-2 text-xs bg-white outline-none cursor-pointer"
                            >
                              <option value="">부자재 선택</option>
                              {materials.map((m) => (
                                <option key={m.id} value={m.name}>{m.name}</option>
                              ))}
                            </select>
                            <input 
                              type="number" 
                              placeholder="소요수량" 
                              value={item.qty}
                              onChange={(e) => handleDynamicBomChange(index, 'qty', e.target.value)}
                              className="w-24 border rounded-lg p-2 text-xs outline-none"
                            />
                            {dynamicBomItems.length > 1 && (
                              <button 
                                type="button"
                                onClick={() => removeDynamicBomRow(index)}
                                className="text-red-500 hover:text-red-700 font-bold px-1 cursor-pointer"
                              >
                                &times;
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-3 border-t">
                    <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition cursor-pointer">취소</button>
                    <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg text-sm text-white bg-emerald-600 hover:bg-emerald-700 transition cursor-pointer">{submitting ? '저장 중...' : '저장하기'}</button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSubmitStock} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">자재 선택</label>
                    <select 
                      value={selectedMaterial} 
                      onChange={(e) => setSelectedMaterial(e.target.value)}
                      className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white cursor-pointer"
                      required
                    >
                      <option value="">자재를 선택하세요</option>
                      {materials && materials.length > 0 ? (
                        materials.map((m) => (
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
                    <label className="block text-sm font-medium text-slate-700 mb-1">수량</label>
                    <input 
                      type="number" 
                      placeholder="수량을 입력하세요 (예: 1000)" 
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">참조 번호 (Ref)</label>
                    <input 
                      type="text" 
                      placeholder="예: #RM1026A" 
                      value={refNo}
                      onChange={(e) => setRefNo(e.target.value)}
                      className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t">
                    <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition cursor-pointer">취소</button>
                    <button type="submit" disabled={submitting} className={`px-4 py-2 rounded-lg text-sm text-white transition cursor-pointer ${modalType === 'inbound' ? 'bg-slate-800 hover:bg-slate-900' : 'bg-blue-600 hover:bg-blue-700'}`}>
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