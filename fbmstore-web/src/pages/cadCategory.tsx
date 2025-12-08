// fbm-web/src/pages/cadCategory.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdMenu } from 'react-icons/md';
import Menu from '@/components/ui/Menu';
import FloatingLabelInput from '@/components/ui/FloatingLabelInput';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import {
  createCategory,
  listCategories, // Usado para re-fetch de lista após delete
  editCategory,
  deleteCategory,
} from '@/services/CadCategoryService';
import { Category } from '@/types';
import { useCategory } from '@/contexts/CategoryContext'; // Fonte de dados para lista
import { useClient } from '@/contexts/ClientContext';

const CadCategoryPage: React.FC = () => {
  const { searchCategories } = useCategory();
  const navigate = useNavigate();
  // Obtemos a lista e as funções de manipulação do contexto global
  const { clients, fetchClients, loggedClient, isAdmin, logoutClient } = useClient();
  const { categoriesItems, createCategory: addCategoryToContext, updateCategory: updateCategoryInContext } = useCategory();

  const [categoryName, setCategoryName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const showToast = (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => {
    toast[type](
      <div>
        <strong>{title}</strong>
        <div>{message}</div>
      </div>
    );
  };

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    if (!categoryName) {
      showToast('warning', 'Atenção!', 'O nome da categoria é obrigatório.');
      return;
    }

    setSubmitting(true);
    let result;

    if (isEditing && selectedCategory) {
      // Editar
      const status = await editCategory(token ?? '', selectedCategory._id, categoryName);
      if (status === 204) {
        updateCategoryInContext(selectedCategory._id, categoryName);
        showToast('success', 'Sucesso!', 'Categoria atualizada com sucesso.');
        handleCancelEdit();
      } else {
        showToast('error', 'Erro!', 'Falha ao atualizar categoria.');
      }
    } else {
      // Criar
      result = await createCategory(token ?? '', categoryName);
      if (result && !result.error) {
        addCategoryToContext(result.body);
        showToast('success', 'Sucesso!', result.msg || 'Categoria criada com sucesso.');
        setCategoryName('');
      } else {
        showToast('error', 'Erro!', result?.msg || 'Falha ao criar categoria.');
      }
    }

    setSubmitting(false);
  };

  const handleDelete = async (categoryId: string) => {
    if (!window.confirm('Tem certeza que deseja deletar esta categoria?')) return;

    const token = localStorage.getItem('token');
    setSubmitting(true);

    const status = await deleteCategory(token ?? '', categoryId);

    if (status === 204) {
      await searchCategories(); 
      showToast('success', 'Deletada!', 'Categoria excluída com sucesso.');
    } else {
      showToast('error', 'Erro!', 'Falha ao excluir categoria.');
    }

    setSubmitting(false);
    handleCancelEdit();
  };

  const handleSelectCategory = (category: Category) => {
    setSelectedCategory(category);
    setCategoryName(category.name);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setSelectedCategory(null);
    setCategoryName('');
    setIsEditing(false);
  };

  const handleMenuOption = (option: string) => {
    setMenuVisible(false);
    switch (option) {
      case 'Produtos':
        navigate('/');
        break;
      case 'Minha Conta':
        navigate(`/store/account/${loggedClient?.client._id}`);
        break;
      case 'Meus Pedidos':
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
      case 'CadProduct':
        navigate('/cad-product');
        break;
      case 'CadSupplier':
        navigate('/cad-supplier');
        break;
      case 'Pedidos':
        navigate('/store/orders');
        break;
      case 'Clientes':
        navigate('/clientes');
        break;  
      default:
        break;
    }
  };

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

      <h1 style={styles.headerTitle}>{isEditing ? 'Editar Categoria' : 'Cadastrar Categoria'}</h1>

      <span style={{ width: 30 }} />
    </header>
  ), [isEditing]);

  return (
    <div style={styles.page}>
      {Header}

      <main style={styles.main}>
        <div style={styles.formContainer}>
          <FloatingLabelInput
            label="Nome da Categoria"
            value={categoryName}
            onChangeText={setCategoryName}
            containerWidth={'100%'}
          />

          <div style={styles.buttonGroup}>
            <button
              onClick={handleSave}
              disabled={submitting}
              style={{
                ...styles.button,
                opacity: submitting ? 0.7 : 1,
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? (isEditing ? 'Salvando...' : 'Cadastrando...') : (isEditing ? 'Salvar Alterações' : 'Cadastrar')}
            </button>
            
            {isEditing && (
              <>
                <button
                  onClick={() => handleDelete(selectedCategory!._id)}
                  disabled={submitting}
                  style={{
                    ...styles.buttonDelete,
                    opacity: submitting ? 0.7 : 1,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  Excluir Categoria
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={submitting}
                  style={styles.buttonCancel}
                >
                  Cancelar Edição
                </button>
              </>
            )}
          </div>

          <h2 style={styles.sectionTitle}>Categorias Existentes</h2>
          <div style={styles.listContainer}>
            {categoriesItems.map((category) => (
              <div key={category._id} style={styles.listItem} onClick={() => handleSelectCategory(category)}>
                <span>{category.name}</span>
                <span style={styles.editBtn}>✏️</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Menu
        visible={menuVisible}
        setVisible={setMenuVisible}
        userName={loggedClient?.client.name}
        userDoc=""
        userAdmin={isAdmin}
        onProducts={() => handleMenuOption('Produtos')}
        onMinhaConta={() => handleMenuOption('Minha Conta')}
        onPoliticaPrivacidade={() => handleMenuOption('Pop')}
        onMeusPedidos={() => handleMenuOption('Meus Pedidos')}
        onSobre={() => handleMenuOption('Sobre')}
        onContatos={() => handleMenuOption('Contacts')}
        onCadProduct={() => handleMenuOption('CadProduct')}
        onCadSupplier={() => handleMenuOption('CadSupplier')}
        onAllClients={() => handleMenuOption('Clientes')}
        onAllOrders={() => handleMenuOption('Pedidos')}
        onSair={logoutClient}
      />
      <ToastContainer position="bottom-center" newestOnTop closeOnClick />
    </div>
  );
};

export default CadCategoryPage;

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#f5f5f5', display: 'flex', flexDirection: 'column' as const },
  header: {
    background: '#000',
    color: '#fff',
    padding: '24px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '0.5px solid #ddd',
  },
  headerTitle: { fontSize: 20, fontWeight: 600 as const, color: '#e799a6', margin: 0 },
  main: { flex: 1, display: 'flex', justifyContent: 'center', padding: 24, boxSizing: 'border-box' as const },
  formContainer: {
    width: '100%',
    maxWidth: 540,
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 8px 30px rgba(0,0,0,.08)',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    alignItems: 'center',
  },
  buttonGroup: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  button: {
    width: '100%',
    padding: '14px 16px',
    background: '#e799a6',
    color: '#fff',
    borderRadius: 8,
    border: 0,
    fontWeight: 700 as const,
    boxSizing: 'border-box',
    cursor: 'pointer',
  },
  buttonDelete: {
    width: '100%',
    padding: '14px 16px',
    background: '#d32f2f',
    color: '#fff',
    borderRadius: 8,
    border: 0,
    fontWeight: 700 as const,
    boxSizing: 'border-box',
    cursor: 'pointer',
  },
  buttonCancel: {
    width: '100%',
    padding: '14px 16px',
    background: '#ccc',
    color: '#333',
    borderRadius: 8,
    border: 0,
    fontWeight: 700 as const,
    boxSizing: 'border-box',
    cursor: 'pointer',
  },
  sectionTitle: { fontSize: 18, fontWeight: 700 as const, color: '#e799a6', margin: '10px 0', textAlign: 'center' },
  listContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
    maxHeight: 300,
    overflowY: 'auto',
    padding: 8,
    border: '1px solid #ddd',
    borderRadius: 8,
  },
  listItem: {
    background: '#fff',
    padding: 12,
    borderRadius: 6,
    boxShadow: '0 1px 3px rgba(0,0,0,.05)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    borderLeft: '4px solid #e799a6',
  },
  editBtn: {
    fontSize: 18,
    color: '#e799a6',
  },
};