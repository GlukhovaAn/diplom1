import React, { useEffect, useState } from "react";
import { Plus, Edit, Trash2, X, RefreshCw } from "lucide-react";
import axios from "../../utils/axios";
import { TableWrapper } from "../../components/admin/Table";

interface Capsule {
  _id: string;
  name: string;
  description: string;
  type: string;
  isPublished: boolean;
  items: CapsuleItem[];
  createdAt: string;
}

interface CapsuleProduct {
  _id: string;
  name: string;
  brand: string;
  colorGroup?: string[];
  style?: string[];
  season?: string[];
}

interface CapsuleItem {
  product: CapsuleProduct;
  role: string;
  order: number;
}

const AdminCapsules: React.FC = () => {
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCapsule, setEditingCapsule] = useState<Capsule | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "manual",
    isPublished: false,
  });

  useEffect(() => {
    console.log("start fetch");
    fetchCapsules();
  }, []);

  const fetchCapsules = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/admin/capsules");
      setCapsules(res.data.capsules || []);
      console.log("fetchCapsules");
    } catch (e) {
      console.error("Error fetching capsules", e);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 Генерация капсул
  const handleGenerate = async () => {
    try {
      await axios.post("/admin/capsules/generate-all");
      alert("Капсулы успешно сгенерированы");
      fetchCapsules();
    } catch (e) {
      console.error(e);
      alert("Ошибка генерации");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/admin/capsules/${id}`);
      fetchCapsules();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = (capsule: Capsule) => {
    setEditingCapsule(capsule);
    setFormData({
      name: capsule.name,
      description: capsule.description,
      type: capsule.type,
      isPublished: capsule.isPublished,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingCapsule) {
        await axios.put(`/admin/capsules/${editingCapsule._id}`, formData);
      } else {
        await axios.post(`/admin/capsules`, formData);
      }

      setShowModal(false);
      resetForm();
      fetchCapsules();
    } catch (e) {
      console.error(e);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "manual",
      isPublished: false,
    });
    setEditingCapsule(null);
  };
  console.log(capsules);
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Капсулы</h1>

        <div className="flex gap-2">
          <button
            onClick={handleGenerate}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-purple-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Сгенерировать
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Добавить
          </button>
        </div>
      </div>

      {/* TABLE */}
      <TableWrapper
        loading={loading}
        isEmpty={capsules.length === 0}
        emptyError="Нет капсул"
        headArr={["Название", "Тип", "Товаров", "Статус", "Дата", "Действия"]}
      >
        {capsules.map((capsule) => (
          <tr key={capsule._id} className="hover:bg-gray-50">
            <td className="px-6 py-4">{capsule.name}</td>

            <td className="px-6 py-4">
              <span className="text-sm">{capsule.type}</span>
            </td>

            <td className="px-6 py-4">{capsule.items?.length || 0}</td>

            <td className="px-6 py-4">
              {capsule.isPublished ? (
                <span className="text-green-600">Опубликовано</span>
              ) : (
                <span className="text-gray-400">Черновик</span>
              )}
            </td>

            <td className="px-6 py-4">
              {new Date(capsule.createdAt).toLocaleDateString()}
            </td>

            <td className="px-6 py-4">
              <button
                onClick={() => handleEdit(capsule)}
                className="text-blue-600 mr-2"
              >
                <Edit className="w-5 h-5" />
              </button>

              <button
                onClick={() => handleDelete(capsule._id)}
                className="text-red-600"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </td>
          </tr>
        ))}
      </TableWrapper>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white w-full max-w-xl rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingCapsule ? "Редактировать" : "Создать"} капсулу
              </h2>

              <button onClick={() => setShowModal(false)}>
                <X />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Название"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full border p-2 rounded"
                required
              />

              <textarea
                placeholder="Описание"
                value={formData.description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    description: e.target.value,
                  })
                }
                className="w-full border p-2 rounded"
              />

              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="w-full border p-2 rounded"
              >
                <option value="manual">Manual</option>
                <option value="auto">Auto</option>
                <option value="trend">Trend</option>
                <option value="personal">Personal</option>
              </select>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isPublished: e.target.checked,
                    })
                  }
                />
                Опубликовать
              </label>

              <div className="mt-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold">Товары в капсуле</h3>

                  <button
                    type="button"
                    onClick={() => alert("TODO: открыть выбор товаров")}
                    className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700"
                  >
                    + Добавить товар
                  </button>
                </div>

                <TableWrapper
                  loading={false}
                  isEmpty={!editingCapsule?.items?.length}
                  emptyError="Нет товаров в капсуле"
                  headArr={[
                    "Товар",
                    "Роль",
                    "Цвет",
                    "Стиль",
                    "Сезон",
                    "Удалить",
                  ]}
                >
                  {editingCapsule?.items?.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      {/* Товар */}
                      <td className="px-4 py-2">
                        <div>
                          <div className="font-medium">
                            {item.product?.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.product?.brand}
                          </div>
                        </div>
                      </td>

                      {/* Роль */}
                      <td className="px-4 py-2">
                        <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {item.role}
                        </span>
                      </td>

                      {/* Цвет */}
                      <td className="px-4 py-2 text-sm">
                        {item.product?.colorGroup?.join(", ") || "-"}
                      </td>

                      {/* Стиль */}
                      <td className="px-4 py-2 text-sm">
                        {item.product?.style?.join(", ") || "-"}
                      </td>

                      {/* Сезон */}
                      <td className="px-4 py-2 text-sm">
                        {item.product?.season?.join(", ") || "-"}
                      </td>

                      {/* Удалить */}
                      <td className="px-4 py-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (!editingCapsule) return;

                            const updatedItems = editingCapsule.items.filter(
                              (_, i) => i !== index
                            );

                            setEditingCapsule({
                              ...editingCapsule,
                              items: updatedItems,
                            });
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </TableWrapper>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded"
                >
                  Отмена
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCapsules;
