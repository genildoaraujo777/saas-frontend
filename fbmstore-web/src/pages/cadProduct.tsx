// fbm-web/src/pages/cadProduct.tsx
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdMenu, MdPhotoCamera, MdClose, MdDragIndicator } from 'react-icons/md';
import Menu from '@/components/ui/Menu';
import FloatingLabelInput from '@/components/ui/FloatingLabelInput';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// NOVO: Importações para Drag and Drop
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import {
  createProduct,
  listAllProducts,
  editProduct,
  deleteProduct,
} from '@/services/CadProductService';
import { uploadImage } from '@/services/FileStorageService';
import { useCategory } from '@/contexts/CategoryContext';
import { useSupplier } from '@/contexts/SupplierContext';
import { Product } from '@/types';
import { brlToNumber, numberToBRL } from '@/utils/currency';
import { useClient } from '@/contexts/ClientContext';

// NOVO: Estrutura para item da galeria
type GalleryItem = {
  id: string; // ID único para o DND Kit (pode ser o nome do arquivo ou um ID gerado)
  url: string; // URL para exibição (seja local via createObjectURL ou do servidor)
  file?: File; // O objeto File, apenas para novos uploads
  isNew: boolean; // Flag para identificar novos uploads
};

// ALTERADO: O form agora lida com um array de imagens
type ProductForm = Omit<Product, '_id' | 'category' | 'supplier' | 'updatedAt' | 'imagePaths'> & {
  _id?: string;
  category: string;
  supplier: string;
  imagePaths: string[]; // Alterado de imagePath para imagePaths
};

const initialFormState: ProductForm = {
  code: '',
  description: '',
  packaging: '',
  price: '',
  unitPrice: '',
  barcode: '',
  ipi: '',
  category: '',
  supplier: '',
  quantityStock: 0,
  imagePaths: [], // Alterado de imagePath para imagePaths
  disable: false,
};

const formatPriceInput = (value: string): string => {
  let cleaned = value.replace(/\D/g, '');
  if (cleaned.length === 0) return '0,00';
  const numberValue = parseInt(cleaned, 10) / 100;
  return numberToBRL(numberValue).replace('R$ ', '');
};

// NOVO: Componente para cada item arrastável na galeria
const SortableImageItem: React.FC<{ item: GalleryItem; onRemove: (id: string) => void }> = ({ item, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: 'none', // Otimização para dispositivos de toque
  };

  return (
    <div ref={setNodeRef} style={{ ...styles.galleryItem, ...style }} {...attributes}>
      <div {...listeners} style={styles.dragHandle} title="Mover imagem">
        <MdDragIndicator size={24} color="#555" />
      </div>
      <img src={item.url} alt="Preview do produto" style={styles.galleryImage} />
      <button onClick={() => onRemove(item.id)} style={styles.clearImageBtn} title="Remover imagem">
        <MdClose size={18} color="#fff" />
      </button>
    </div>
  );
};


const CadProductPage: React.FC = () => {
  const navigate = useNavigate();
  const { clients, fetchClients, loggedClient, isAdmin, logoutClient } = useClient();
  const { categoriesItems } = useCategory();
  const { suppliersItems } = useSupplier();
  
  const [formData, setFormData] = useState<ProductForm>(initialFormState);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  // NOVO: Estado para gerenciar os itens da galeria (novos e existentes)
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);

  // Configuração dos sensores do DND Kit
  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8, // Inicia o drag após mover 8px
    },
  }));

  useEffect(() => {
    loadAllProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup para as URLs de preview (ObjectURL)
  useEffect(() => {
    return () => {
      galleryItems.forEach(item => {
        if (item.isNew && item.url.startsWith('blob:')) {
          URL.revokeObjectURL(item.url);
        }
      });
    };
  }, [galleryItems]);

  const loadAllProducts = async () => {
      const products = await listAllProducts();
      setAllProducts(products);
  }

  const showToast = (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => {
    toast[type](
      <div>
        <strong>{title}</strong>
        <div>{message}</div>
      </div>
    );
  };

  const handleInputChange = (field: keyof ProductForm, value: string | number | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  
  const handlePriceChange = (v: string, field: 'price' | 'unitPrice') => {
    const formattedValue = formatPriceInput(v);
    handleInputChange(field, formattedValue);
  }

  // ALTERADO: Lida com múltiplos arquivos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newItems: GalleryItem[] = Array.from(files).map(file => ({
        id: `${file.name}-${Date.now()}`, // ID único
        url: URL.createObjectURL(file),
        file: file,
        isNew: true,
      }));
      setGalleryItems(prev => [...prev, ...newItems]);
    }
    // Limpa o input para permitir selecionar o mesmo arquivo novamente
    e.target.value = "";
  };
  
  // NOVO: Remove uma imagem da galeria pelo seu ID
  const handleRemoveImage = (idToRemove: string) => {
    setGalleryItems(prev => prev.filter(item => item.id !== idToRemove));
  }

  // NOVO: Função que reordena a galeria após o drag and drop
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setGalleryItems((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSave = async () => {
    if (!formData.code || !formData.description || !formData.packaging || !formData.price || !formData.category || !formData.supplier || formData.quantityStock < 0) {
      showToast('warning', 'Atenção!', 'Preencha todos os campos obrigatórios.');
      return;
    }

    if (galleryItems.length === 0) {
      showToast('warning', 'Atenção!', 'É necessário adicionar pelo menos uma imagem para o produto.');
      return;
    }

    setSubmitting(true);
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showToast('error', 'Erro!', 'Sua sessão expirou. Faça login novamente.');
            setSubmitting(false);
            return;
        }

        const uploadedImagePaths: string[] = [];

        // 1. Faz o upload APENAS das novas imagens
        const newImageItems = galleryItems.filter(item => item.isNew && item.file);
        if (newImageItems.length > 0) {
            showToast('info', 'Upload...', `Enviando ${newImageItems.length} nova(s) imagem(ns)...`);

            const uploadPromises = newImageItems.map(item => uploadImage(token, item.file!));
            const uploadResults = await Promise.all(uploadPromises);
            
            let hasUploadError = false;
            uploadResults.forEach((result, index) => {
                if (!result.success) {
                    showToast('error', 'Erro no Upload!', result.msg || `Falha ao enviar o arquivo ${newImageItems[index].file?.name}.`);
                    hasUploadError = true;
                } else {
                    uploadedImagePaths.push(result.imagePaths!);
                }
            });

            if(hasUploadError) {
              setSubmitting(false);
              return;
            }
        }
        
        // 2. Monta a lista final de caminhos na ordem correta da galeria
        const finalImagePaths = galleryItems.map(item => {
            if (item.isNew) {
                const uploadedItemIndex = newImageItems.findIndex(newItem => newItem.id === item.id);
                return uploadedImagePaths[uploadedItemIndex];
            } else {
                const urlParts = item.url.split('fileName=');
                return urlParts.length > 1 ? decodeURIComponent(urlParts[1]) : item.url;
            }
        }).filter(Boolean); // Garante que não há caminhos nulos/undefined

        const productDataForApi: ProductForm = {
            ...formData,
            quantityStock: Number(formData.quantityStock), 
            imagePaths: finalImagePaths, // Envia o array ordenado de caminhos
            price: numberToBRL(brlToNumber(formData.price)),
            unitPrice: numberToBRL(brlToNumber(formData.unitPrice)),
        };

        let result;
        if (isEditing && selectedProduct) {
          result = await editProduct(token, selectedProduct._id!, productDataForApi);
          if (result && !result.error) {
            showToast('success', 'Sucesso!', 'Produto atualizado com sucesso.');
            loadAllProducts();
            handleCancelEdit();
          } else {
            showToast('error', 'Erro!', result?.msg || 'Falha ao atualizar produto.');
          }
        } else {
          result = await createProduct(token, productDataForApi);
          if (result && !result.error) {
            showToast('success', 'Sucesso!', 'Produto criado com sucesso.');
            setFormData(initialFormState);
            setGalleryItems([]);
            loadAllProducts();
          } else {
            showToast('error', 'Erro!', result?.msg || 'Falha ao criar produto. Verifique se o código é único.');
          }
        }
    } catch(e) {
        console.error(e);
        showToast('error', 'Erro Inesperado!', 'Ocorreu um erro ao salvar o produto.');
    } finally {
        setSubmitting(false);
    }
  };

    const handleDelete = async (productId: string) => {
    if (!window.confirm('Tem certeza que deseja deletar este produto?')) return;
    const token = localStorage.getItem('token');

    setSubmitting(true);

    const status = await deleteProduct(token ?? '', productId);

    if (status === 200) {
      showToast('success', 'Deletado!', 'Produto excluído com sucesso.');
      loadAllProducts();
    } else {
      showToast('error', 'Erro!', 'Falha ao excluir produto.');
    }

    setSubmitting(false);
    handleCancelEdit();
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsEditing(true);

    // @ts-ignore
    const BASE_URL = import.meta.env.VITE_BASE_URL;
    const existingImages: GalleryItem[] = (product.imagePaths || []).map((path) => {
      let fileName = path.startsWith('/files/') ? path.substring('/files/'.length) : path;
      return {
        id: fileName,
        url: `${BASE_URL}/files/image?fileName=${encodeURIComponent(fileName)}`,
        isNew: false,
      };
    });
    setGalleryItems(existingImages);
    
    setFormData({
        _id: product._id,
        code: product.code,
        description: product.description,
        packaging: product.packaging,
        price: product.price, 
        unitPrice: product.unitPrice, 
        barcode: product.barcode,
        ipi: product.ipi,
        quantityStock: product.quantityStock,
        imagePaths: product.imagePaths || [],
        category: typeof product.category !== 'string' ? product.category._id : product.category,
        supplier: typeof product.supplier !== 'string' ? product.supplier._id : product.supplier,
        disable: product.disable || false,
    });
  };

  const handleCancelEdit = () => {
    setSelectedProduct(null);
    setFormData(initialFormState);
    setIsEditing(false);
    setGalleryItems([]); // Limpa a galeria
  };

  const logout = useCallback(() => {
    try {
      localStorage.removeItem('token');
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Erro ao deslogar:', err);
    }
  }, [navigate]);

  const handleMenuOption = useCallback((option: string) => {
    setMenuVisible(false);
    switch (option) {
      case 'Produtos':
        navigate('/');
        break;
      case 'Minha Conta':
        navigate(`/store/account/${loggedClient?.client._id}`);
        break;
      case 'Minhas Assinaturas':
        navigate(`/store/orders/${false}`);
        break;
      case 'Pop':
        navigate('/politica-privacidade');
        break;
      case 'Contacts':
        navigate('/contacts');
        break;
      case 'Sobre':
        navigate('/sobre');
        break;
      case 'CadCategory':
        navigate('/cad-category');
        break;
      case 'CadSupplier':
        navigate('/cad-supplier');
        break;
      case 'Assinaturas':
        navigate('/store/orders');
        break;
      case 'Clientes':
        navigate('/clientes');
        break;
      default:
        break;
    }
  }, [navigate, logout]);

  const Header = useMemo(() => (
    <header style={styles.header}>
      <button
        onClick={() => setMenuVisible((p) => !p)}
        style={{ background: 'transparent', border: 0, color: '#fff', cursor: 'pointer' }}
        aria-label="Abrir menu"
        title="Abrir menu"
      >
        <MdMenu size={30} />
      </button>
      <h1 style={styles.headerTitle}>{isEditing ? 'Editar Produto' : 'Cadastrar Produto'}</h1>
      <span style={{ width: 30 }} />
    </header>
  ), [isEditing]);

  return (
    <div style={styles.page}>
      {Header}
      <main style={styles.main}>
        <div style={styles.formContainer}>
          <h2 style={styles.sectionTitle}>{isEditing ? 'Dados do Produto' : 'Novo Produto'}</h2>
          
          <div style={styles.imageUploadArea}>
            <p style={styles.imageUploadLabel}>Imagens do Produto (a primeira será a principal):</p>
            <label style={styles.fileInputLabel}>
                <MdPhotoCamera size={20} />
                <span>Selecionar Imagens</span>
                <input 
                    id="fileInput"
                    type="file" 
                    accept="image/*" 
                    multiple
                    onChange={handleFileChange} 
                    style={{ display: 'none' }}
                />
            </label>
          </div>
          
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={galleryItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
              <div style={styles.galleryContainer}>
                {galleryItems.length > 0 ? (
                  galleryItems.map((item, index) => (
                    <React.Fragment key={item.id}>
                      {index === 0 && <div style={styles.mainImageBadge}>Principal</div>}
                      <SortableImageItem item={item} onRemove={handleRemoveImage} />
                    </React.Fragment>
                  ))
                ) : (
                  <div style={styles.imagePlaceholder}>
                    <p>Nenhuma imagem selecionada.</p>
                  </div>
                )}
              </div>
            </SortableContext>
          </DndContext>

          <FloatingLabelInput
            label="Código do Produto *"
            value={formData.code}
            onChangeText={(v) => handleInputChange('code', v)}
            containerWidth={'100%'}
            readOnly={isEditing} 
            style={isEditing ? { background: '#f0f0f0' } : {}}
          />
           <FloatingLabelInput
            label="Descrição *"
            value={formData.description}
            onChangeText={(v) => handleInputChange('description', v)}
            containerWidth={'100%'}
          />
          <FloatingLabelInput
            label="Embalagem *"
            value={formData.packaging}
            onChangeText={(v) => handleInputChange('packaging', v)}
            containerWidth={'100%'}
          />
          <FloatingLabelInput
            label="Preço (R$) *"
            value={formData.price}
            onChangeText={(v) => handlePriceChange(v, 'price')}
            keyboardType="numeric"
            containerWidth={'100%'}
          />
          <FloatingLabelInput
            label="Preço Unitário (R$)"
            value={formData.unitPrice}
            onChangeText={(v) => handlePriceChange(v, 'unitPrice')}
            keyboardType="numeric"
            containerWidth={'100%'}
          />
          <FloatingLabelInput
            label="Código de Barras (Barcode)"
            value={formData.barcode}
            onChangeText={(v) => handleInputChange('barcode', v)}
            keyboardType="numeric"
            containerWidth={'100%'}
          />
          <FloatingLabelInput
            label="IPI (%)"
            value={formData.ipi}
            onChangeText={(v) => handleInputChange('ipi', v.replace(/[^\d,.]/g, ''))}
            keyboardType="numeric"
            containerWidth={'100%'}
          />
          <FloatingLabelInput
            label="Estoque Atual *"
            value={String(formData.quantityStock)}
            onChangeText={(v) => handleInputChange('quantityStock', parseInt(v) || 0)}
            keyboardType="numeric"
            containerWidth={'100%'}
          />
          <div style={styles.selectContainer}>
            <label style={styles.selectLabel}>Categoria *</label>
            <select
              style={styles.selectInput}
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
            >
              <option value="">Selecione a Categoria</option>
              {categoriesItems.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div style={styles.selectContainer}>
            <label style={styles.selectLabel}>Fornecedor *</label>
            <select
              style={styles.selectInput}
              value={formData.supplier}
              onChange={(e) => handleInputChange('supplier', e.target.value)}
            >
              <option value="">Selecione o Fornecedor</option>
              {suppliersItems.map((sup) => (
                <option key={sup._id} value={sup._id}>{sup.name}</option>
              ))}
            </select>
          </div>

          <div style={styles.buttonGroup}>
             <button onClick={handleSave} disabled={submitting} style={{ ...styles.button, opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer', }}>
              {submitting ? (isEditing ? 'Salvando...' : 'Cadastrando...') : (isEditing ? 'Salvar Alterações' : 'Cadastrar Produto')}
            </button>
            {isEditing && selectedProduct && (
              <>
                <button onClick={() => handleDelete(selectedProduct!._id!)} disabled={submitting} style={{ ...styles.buttonDelete, backgroundColor: selectedProduct?.disable ? '#4CAF50' : '#F44336', opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer', }}>
                  {selectedProduct?.disable ? 'Ativar Produto' : 'Desativar Produto'}
                </button>
                <button onClick={handleCancelEdit} disabled={submitting} style={styles.buttonCancel}>
                  Cancelar Edição
                </button>
              </>
            )}
          </div>
          
          <h2 style={styles.sectionTitle}>Produtos Existentes</h2>
          <div style={styles.listContainer}>
            {allProducts.map((product) => (
              <div key={product._id} style={product.disable ? styles.listItemDisable : styles.listItem} onClick={() => handleSelectProduct(product)}>
                <span>{product.code} - {product.description}</span>
                <span style={styles.editBtn}>✏️</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Menu
        visible={menuVisible} setVisible={setMenuVisible} 
        userName={loggedClient?.client.name} 
        userDoc="" userAdmin={isAdmin}
        onProducts={() => handleMenuOption('Produtos')} 
        onMinhaConta={() => handleMenuOption('Minha Conta')}
        onPoliticaPrivacidade={() => handleMenuOption('Pop')} 
        onMinhasAssinaturas={() => handleMenuOption('Minhas Assinaturas')}
        onSobre={() => handleMenuOption('Sobre')} 
        onContatos={() => handleMenuOption('Contacts')}
        onCadCategory={() => handleMenuOption('CadCategory')} 
        onCadSupplier={() => handleMenuOption('CadSupplier')}
        onAllClients={() => handleMenuOption('Clientes')}
        onAllOrders={() => handleMenuOption('Assinaturas')}
        onSair={logoutClient}
      />
      <ToastContainer position="bottom-center" newestOnTop closeOnClick />
    </div>
  );
};

export default CadProductPage;

// ALTERADO: Adição e modificação de estilos
const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#f5f5f5', display: 'flex', flexDirection: 'column' as const },
  header: {
    background: "#0f172a", 
    color: "#fff",
    padding: "20px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid #1e293b",
    width: "100%",
    boxSizing: "border-box",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  },
  headerTitle: { fontSize: 20, fontWeight: 700 as const, color: "#fff", margin: 0, letterSpacing: '0.5px' },
  main: { flex: 1, display: 'flex', justifyContent: 'center', padding: 24, boxSizing: 'border-box' as const },
  formContainer: { width: '100%', maxWidth: 600, background: '#fff', borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,.08)', padding: '24px', display: 'flex', flexDirection: 'column' as const, gap: '16px', alignItems: 'center' },
  imageUploadArea: { width: '100%', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '12px', marginBottom: '16px' },
  imageUploadLabel: { fontSize: 16, fontWeight: 'bold', color: '#333', margin: 0, alignSelf: 'flex-start' },
  fileInputLabel: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 15px', background: '#4f46e5', color: '#fff', borderRadius: 8, cursor: 'pointer', fontWeight: 600 as const },
  
  // NOVO: Estilos para a galeria
  galleryContainer: { width: '100%', minHeight: 100, border: '2px dashed #4f46e5', borderRadius: 8, padding: '10px', display: 'flex', flexDirection: 'column' as const, gap: '10px', background: '#fafafa' },
  galleryItem: { display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 6, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '8px', position: 'relative' },
  galleryImage: { width: 60, height: 60, objectFit: 'cover' as const, borderRadius: 4, border: '1px solid #ddd', marginLeft: '10px', },
  dragHandle: { cursor: 'grab', padding: '8px' },
  clearImageBtn: { position: 'absolute', top: -5, right: -5, background: 'rgba(211, 47, 47, 0.9)', border: 'none', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' },
  imagePlaceholder: { width: '100%', textAlign: 'center' as const, color: '#aaa', padding: '30px 0' },
  mainImageBadge: { background: '#4CAF50', color: 'white', fontSize: 10, fontWeight: 'bold', padding: '2px 6px', borderRadius: 4, position: 'absolute', transform: 'translate(8px, -12px)', zIndex: 2 },
  
  buttonGroup: { width: '100%', display: 'flex', flexDirection: 'column' as const, gap: '8px' },
  button: { width: '100%', padding: '14px 16px', background: '#4f46e5', color: '#fff', borderRadius: 8, border: 0, fontWeight: 700 as const, boxSizing: 'border-box', cursor: 'pointer' },
  buttonDelete: { width: '100%', padding: '14px 16px', background: '#d32f2f', color: '#fff', borderRadius: 8, border: 0, fontWeight: 700 as const, boxSizing: 'border-box', cursor: 'pointer' },
  buttonCancel: { width: '100%', padding: '14px 16px', background: '#ccc', color: '#333', borderRadius: 8, border: 0, fontWeight: 700 as const, boxSizing: 'border-box', cursor: 'pointer' },
  sectionTitle: { fontSize: 18, fontWeight: 700 as const, color: '#0f172a', margin: '10px 0', textAlign: 'center' as const },
  listContainer: { width: '100%', display: 'flex', flexDirection: 'column' as const, gap: 8, maxHeight: 300, overflowY: 'auto', padding: 8, border: '1px solid #ddd', borderRadius: 8 },
  listItem: { background: '#fff', padding: 12, borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderLeft: '4px solid #4f46e5' },
  listItemDisable: { background: '#fce4ec', opacity: 0.7, padding: 12, borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderLeft: '4px solid #f44336' },
  editBtn: { fontSize: 18, color: '#4f46e5' },
  selectContainer: { width: '100%', position: 'relative', marginTop: 12, marginBottom: 12, border: '1px solid #4f46e5', borderRadius: 8, paddingTop: 10 },
  selectLabel: { position: 'absolute', top: -10, left: 8, paddingLeft: 4, paddingRight: 4, fontSize: 12, color: '#666', background: '#fff' },
  selectInput: { width: '100%', height: 42, border: 'none', borderRadius: 8, paddingLeft: 12, paddingRight: 12, fontSize: 16, background: 'transparent', color: '#111', outline: 'none' },
};