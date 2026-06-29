import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "@/react-app/auth";
import { useAdmin } from "../hooks/useAdmin";
import { Package, Plus, Edit2, Trash2, ArrowLeft, Truck, Percent, Link, Key } from "lucide-react";

interface Supplier {
  id: number;
  name: string;
  type: string;
  api_key?: string;
  api_secret?: string;
  base_url?: string;
  default_margin_percent: number;
  shipping_days_min: number;
  shipping_days_max: number;
  is_active: number;
  settings?: string;
}

const SUPPLIER_TYPES = [
  { value: "aliexpress", label: "AliExpress" },
  { value: "cj_dropshipping", label: "CJ Dropshipping" },
  { value: "printful", label: "Printful" },
  { value: "printify", label: "Printify" },
  { value: "spocket", label: "Spocket" },
  { value: "manual", label: "Manual (sem API)" },
];

export default function AdminSuppliers() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isPending } = useAuth();
  const { isAdmin, isPending: adminLoading } = useAdmin();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [saving, setSaving] = useState(false);
  
  const isDemoMode = location.pathname.includes("/admin/demo");

  const [form, setForm] = useState({
    name: "",
    type: "manual",
    api_key: "",
    api_secret: "",
    base_url: "",
    default_margin_percent: 30,
    shipping_days_min: 7,
    shipping_days_max: 21,
    is_active: true,
  });

  useEffect(() => {
    if (isDemoMode) {
      setSuppliers([
        { id: 1, name: "AliExpress Global", type: "aliexpress", default_margin_percent: 35, shipping_days_min: 15, shipping_days_max: 45, is_active: 1 },
        { id: 2, name: "CJ Dropshipping BR", type: "cj_dropshipping", default_margin_percent: 25, shipping_days_min: 10, shipping_days_max: 30, is_active: 1 },
        { id: 3, name: "Printful POD", type: "printful", default_margin_percent: 40, shipping_days_min: 5, shipping_days_max: 14, is_active: 1 },
      ]);
      setLoading(false);
      return;
    }
    fetchSuppliers();
  }, [isDemoMode]);

  const fetchSuppliers = async () => {
    try {
      const res = await fetch("/api/admin/suppliers");
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemoMode) {
      alert("Demo mode: changes are not saved");
      setShowForm(false);
      return;
    }
    
    setSaving(true);
    try {
      const url = editingSupplier 
        ? `/api/admin/suppliers/${editingSupplier.id}`
        : "/api/admin/suppliers";
      const method = editingSupplier ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      
      if (res.ok) {
        await fetchSuppliers();
        setShowForm(false);
        setEditingSupplier(null);
        resetForm();
      }
    } catch (error) {
      console.error("Error saving supplier:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setForm({
      name: supplier.name,
      type: supplier.type,
      api_key: supplier.api_key || "",
      api_secret: supplier.api_secret || "",
      base_url: supplier.base_url || "",
      default_margin_percent: supplier.default_margin_percent,
      shipping_days_min: supplier.shipping_days_min,
      shipping_days_max: supplier.shipping_days_max,
      is_active: supplier.is_active === 1,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este fornecedor?")) return;
    if (isDemoMode) return;
    
    try {
      await fetch(`/api/admin/suppliers/${id}`, { method: "DELETE" });
      await fetchSuppliers();
    } catch (error) {
      console.error("Error deleting supplier:", error);
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      type: "manual",
      api_key: "",
      api_secret: "",
      base_url: "",
      default_margin_percent: 30,
      shipping_days_min: 7,
      shipping_days_max: 21,
      is_active: true,
    });
  };

  if (!isDemoMode && (isPending || adminLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(210 100% 55%)" }}>
        <div className="panel-raised p-8">Loading...</div>
      </div>
    );
  }

  if (!isDemoMode && (!user || !isAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(210 100% 55%)" }}>
        <div className="panel-raised p-8 text-center">
          <p className="text-lg mb-4">Acesso negado</p>
          <button onClick={() => navigate("/")} className="btn-retro">Voltar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: "hsl(210 100% 55%)" }}>
      <div className="max-w-6xl mx-auto">
        {isDemoMode && (
          <div className="panel-raised p-3 mb-4 text-center" style={{ background: "hsl(45 100% 60%)" }}>
            <span className="font-bold">⚠️ DEMO MODE</span> - Alterações não são salvas
          </div>
        )}

        {/* Header */}
        <div className="panel-raised p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(isDemoMode ? "/admin/demo" : "/admin")}
                className="btn-retro flex items-center gap-2"
              >
                <ArrowLeft size={16} /> Voltar
              </button>
              <div className="flex items-center gap-2">
                <Package className="text-retro-pink" size={24} />
                <h1 className="text-xl font-bold font-display">FORNECEDORES</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(isDemoMode ? "/admin/demo/suppliers/import" : "/admin/suppliers/import")}
                className="btn-retro flex items-center gap-2"
              >
                <Package size={16} /> Importar Produtos
              </button>
              <button
                onClick={() => { resetForm(); setEditingSupplier(null); setShowForm(true); }}
                className="btn-gold flex items-center gap-2"
              >
                <Plus size={16} /> Novo Fornecedor
              </button>
            </div>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="panel-raised p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-bold mb-4 font-display">
                {editingSupplier ? "EDITAR FORNECEDOR" : "NOVO FORNECEDOR"}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-1">Nome</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="panel-inset w-full p-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-1">Tipo</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="panel-inset w-full p-2"
                  >
                    {SUPPLIER_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                {form.type !== "manual" && (
                  <>
                    <div>
                      <label className="block text-sm font-bold mb-1 flex items-center gap-1">
                        <Key size={14} /> API Key
                      </label>
                      <input
                        type="password"
                        value={form.api_key}
                        onChange={(e) => setForm({ ...form, api_key: e.target.value })}
                        className="panel-inset w-full p-2"
                        placeholder="Opcional"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold mb-1">API Secret</label>
                      <input
                        type="password"
                        value={form.api_secret}
                        onChange={(e) => setForm({ ...form, api_secret: e.target.value })}
                        className="panel-inset w-full p-2"
                        placeholder="Opcional"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold mb-1 flex items-center gap-1">
                        <Link size={14} /> Base URL
                      </label>
                      <input
                        type="url"
                        value={form.base_url}
                        onChange={(e) => setForm({ ...form, base_url: e.target.value })}
                        className="panel-inset w-full p-2"
                        placeholder="https://api.supplier.com"
                      />
                    </div>
                  </>
                )}

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-1 flex items-center gap-1">
                      <Percent size={14} /> Margem %
                    </label>
                    <input
                      type="number"
                      value={form.default_margin_percent}
                      onChange={(e) => setForm({ ...form, default_margin_percent: parseInt(e.target.value) || 0 })}
                      className="panel-inset w-full p-2"
                      min="0"
                      max="500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">Dias Mín</label>
                    <input
                      type="number"
                      value={form.shipping_days_min}
                      onChange={(e) => setForm({ ...form, shipping_days_min: parseInt(e.target.value) || 1 })}
                      className="panel-inset w-full p-2"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">Dias Máx</label>
                    <input
                      type="number"
                      value={form.shipping_days_max}
                      onChange={(e) => setForm({ ...form, shipping_days_max: parseInt(e.target.value) || 1 })}
                      className="panel-inset w-full p-2"
                      min="1"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  />
                  <label htmlFor="is_active" className="text-sm font-bold">Ativo</label>
                </div>

                <div className="flex gap-2 pt-4">
                  <button type="submit" className="btn-gold flex-1" disabled={saving}>
                    {saving ? "Salvando..." : "Salvar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setEditingSupplier(null); }}
                    className="btn-retro flex-1"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Suppliers List */}
        {loading ? (
          <div className="panel-raised p-8 text-center">Carregando...</div>
        ) : suppliers.length === 0 ? (
          <div className="panel-raised p-8 text-center">
            <Package size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-4">Nenhum fornecedor cadastrado</p>
            <button onClick={() => setShowForm(true)} className="btn-gold">
              Adicionar Primeiro Fornecedor
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {suppliers.map((supplier) => (
              <div key={supplier.id} className="panel-raised p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${supplier.is_active ? "bg-green-500" : "bg-red-500"}`} />
                    <div>
                      <h3 className="font-bold text-lg">{supplier.name}</h3>
                      <p className="text-sm opacity-70">
                        {SUPPLIER_TYPES.find(t => t.value === supplier.type)?.label || supplier.type}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-retro-gold">
                        <Percent size={14} />
                        <span className="font-bold">{supplier.default_margin_percent}%</span>
                      </div>
                      <span className="text-xs opacity-70">Margem</span>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-retro-pink">
                        <Truck size={14} />
                        <span className="font-bold">{supplier.shipping_days_min}-{supplier.shipping_days_max}</span>
                      </div>
                      <span className="text-xs opacity-70">Dias</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(supplier)}
                        className="btn-retro p-2"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(supplier.id)}
                        className="btn-retro p-2 text-red-600"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
