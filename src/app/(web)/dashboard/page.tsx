"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Pause, Play, Plus, SquarePen, Trash2, Settings2, PlusCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import {
  createDish,
  deleteDish,
  listAdminDishes,
  listCategoryOptions,
  updateDish,
  updateDishSellingStatus,
} from "@/services/dishes-service";
import { calculateCartItemPricing, sanitizeDishDiscount } from "@/lib/checkout";
import type { AdminDish, DishCategoryOption } from "@repo-types/dishes";
import { useSession } from "next-auth/react";
import { ADD_ONS } from "@/components/addons-step";
import { ADDON_EMOJI } from "@/lib/food-emojis";

type AddonSettings = {
  globalEnabled: boolean;
  excludedCategoryNames: string[];
  excludedDishIds: string[];
  dishExcludedAddonIds: Record<string, string[]>;
};

// ─── Small toggle switch ──────────────────────────────────────────────────────
function SwitchToggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${
        checked ? "bg-stone-900" : "bg-stone-200"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function DishesPage() {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  const [dishes, setDishes] = useState<AdminDish[]>([]);
  const [categories, setCategories] = useState<DishCategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<AdminDish | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [filterPaused, setFilterPaused] = useState(false);
  const [filterDiscounted, setFilterDiscounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [addonSettings, setAddonSettings] = useState<AddonSettings>({
    globalEnabled: true,
    excludedCategoryNames: [],
    excludedDishIds: [],
    dishExcludedAddonIds: {},
  });
  const [extrasSettingsOpen, setExtrasSettingsOpen] = useState(false);

  const createEmptyDish = (): AdminDish => {
    const defaultCategory = categories[0]?.name ?? "";
    return {
      _id: "",
      name: "",
      price: 0,
      description: "",
      image: "",
      active: true,
      discount: null,
      includes: [],
      sizes: [],
      variations: [],
      category: defaultCategory,
    };
  };

  const loadDashboardData = async () => {
    try {
      const [adminDishes, categoryOptions, addonSettingsData] = await Promise.all([
        listAdminDishes(),
        listCategoryOptions(),
        fetch("/api/v1/addon-settings")
          .then((r) => r.json() as Promise<AddonSettings>)
          .catch(() => ({
            globalEnabled: true,
            excludedCategoryNames: [],
            excludedDishIds: [],
            dishExcludedAddonIds: {},
          })),
      ]);
      setDishes(adminDishes);
      setCategories(categoryOptions);
      setAddonSettings({ ...addonSettingsData, dishExcludedAddonIds: addonSettingsData.dishExcludedAddonIds ?? {} });
    } catch {
      setError("Error fetching dishes");
    } finally {
      setLoading(false);
    }
  };

  const saveAddonSettings = async (updated: AddonSettings) => {
    if (!accessToken) return;
    setAddonSettings(updated);
    try {
      const res = await fetch("/api/v1/addon-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(updated),
      });
      if (!res.ok) {
        setAddonSettings(addonSettings);
        alert("Failed to update addon settings");
        return;
      }
      const data = (await res.json()) as AddonSettings;
      setAddonSettings({ ...data, dishExcludedAddonIds: data.dishExcludedAddonIds ?? {} });
    } catch {
      setAddonSettings(addonSettings);
      alert("Failed to update addon settings");
    }
  };

  const toggleDishAddon = (dishId: string, enabled: boolean) => {
    saveAddonSettings({
      ...addonSettings,
      excludedDishIds: enabled
        ? addonSettings.excludedDishIds.filter((id) => id !== dishId)
        : [...addonSettings.excludedDishIds, dishId],
    });
  };

  const toggleCategoryAddon = (categoryName: string, enabled: boolean) => {
    saveAddonSettings({
      ...addonSettings,
      excludedCategoryNames: enabled
        ? addonSettings.excludedCategoryNames.filter((n) => n !== categoryName)
        : [...addonSettings.excludedCategoryNames, categoryName],
    });
  };

  const toggleSingleAddonForDish = (dishId: string, addonId: string, enabled: boolean) => {
    const current = addonSettings.dishExcludedAddonIds[dishId] ?? [];
    const next = enabled
      ? current.filter((id) => id !== addonId)
      : [...current, addonId];
    saveAddonSettings({
      ...addonSettings,
      dishExcludedAddonIds: {
        ...addonSettings.dishExcludedAddonIds,
        [dishId]: next,
      },
    });
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterPaused, filterDiscounted]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this dish?")) return;
    const isLastItemOnPage = currentDishes.length === 1 && currentPage > 1;
    try {
      await deleteDish(id);
      setDishes((d) => d.filter((dish) => dish._id !== id));
      if (isLastItemOnPage) setCurrentPage(currentPage - 1);
    } catch {
      alert("Error deleting dish");
    }
  };

  const handleEdit = (dish: AdminDish) => {
    setIsCreateMode(false);
    setEditingDish(dish);
    setIsEditModalOpen(true);
  };

  const handleAddDish = () => {
    setIsCreateMode(true);
    setEditingDish(createEmptyDish());
    setIsEditModalOpen(true);
  };

  const handleSellingStatusChange = async (dish: AdminDish) => {
    const next = !dish.active;
    setDishes((d) => d.map((x) => (x._id === dish._id ? { ...x, active: next } : x)));
    try {
      await updateDishSellingStatus(dish._id, next);
    } catch {
      setDishes((d) => d.map((x) => (x._id === dish._id ? { ...x, active: dish.active } : x)));
      alert("Error updating selling status");
    }
  };

  const handleSave = async () => {
    if (!editingDish) return;
    if (!editingDish.category) { alert("Please select a category"); return; }
    try {
      if (isCreateMode) {
        await createDish({
          name: editingDish.name,
          price: editingDish.price,
          description: editingDish.description,
          image: editingDish.image,
          category: editingDish.category,
          active: editingDish.active,
          discount: sanitizeDishDiscount(editingDish.discount),
        });
        setCurrentPage(1);
        await loadDashboardData();
      } else {
        await updateDish(editingDish._id, {
          name: editingDish.name,
          price: editingDish.price,
          description: editingDish.description,
          image: editingDish.image,
          category: editingDish.category,
          active: editingDish.active,
          discount: sanitizeDishDiscount(editingDish.discount),
        });
        setDishes((d) => d.map((x) => (x._id === editingDish._id ? { ...x, ...editingDish } : x)));
      }
      setIsEditModalOpen(false);
      setEditingDish(null);
    } catch {
      alert(isCreateMode ? "Error creating dish" : "Error updating dish");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editingDish) return;
    const { name, value } = e.target;
    setEditingDish({ ...editingDish, [name]: name === "price" ? parseFloat(value) || 0 : value });
  };

  const handleDiscountChange = (value: string) => {
    if (!editingDish) return;
    const pct = Number.parseFloat(value);
    setEditingDish({ ...editingDish, discount: Number.isFinite(pct) && pct > 0 ? { percentage: pct } : null });
  };

  const filteredDishes = dishes.filter((dish) => {
    if (filterPaused && dish.active) return false;
    if (filterDiscounted && !dish.discount) return false;
    if (filterCategory !== "all" && dish.category !== filterCategory) return false;
    if (searchQuery && !dish.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredDishes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentDishes = filteredDishes.slice(startIndex, startIndex + itemsPerPage);

  return (
    <>
      <div className="min-h-screen flex flex-col items-center bg-gray-100 p-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white p-8 rounded-xl shadow-lg w-full"
        >
          <div className="mb-6 flex items-center justify-between gap-4">
            <h1 className="text-3xl font-bold text-gray-800">Restaurant Menu</h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setExtrasSettingsOpen(true)}>
                <Settings2 className="mr-1.5 h-4 w-4" />
                Extras settings
              </Button>
              <Button onClick={handleAddDish} disabled={categories.length === 0 && !loading}>
                <Plus />
                Add Dish
              </Button>
            </div>
          </div>

          <div className="mb-4 flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-48">
                <Input
                  placeholder="Search dishes..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="pl-3"
                />
              </div>
              <Select value={filterCategory} onValueChange={(v) => { setFilterCategory(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant={filterPaused ? "default" : "outline"} size="sm" onClick={() => setFilterPaused((v) => !v)}>
                <Pause className="mr-1.5 h-3.5 w-3.5" />
                Paused
                {filterPaused && dishes.filter((d) => !d.active).length > 0 && (
                  <span className="ml-1.5 rounded-full bg-white/20 px-1.5 text-xs">{dishes.filter((d) => !d.active).length}</span>
                )}
              </Button>
              <Button variant={filterDiscounted ? "default" : "outline"} size="sm" onClick={() => setFilterDiscounted((v) => !v)}>
                <span className="mr-1.5 text-xs font-bold">%</span>
                Discounted
                {filterDiscounted && dishes.filter((d) => d.discount).length > 0 && (
                  <span className="ml-1.5 rounded-full bg-white/20 px-1.5 text-xs">{dishes.filter((d) => d.discount).length}</span>
                )}
              </Button>
              {(filterPaused || filterDiscounted || searchQuery || filterCategory !== "all") && (
                <Button variant="ghost" size="sm" onClick={() => { setFilterPaused(false); setFilterDiscounted(false); setSearchQuery(""); setFilterCategory("all"); }}>
                  Clear filters
                </Button>
              )}
            </div>
          </div>

          {loading ? (
            <p className="text-gray-600 text-center">Loading dishes...</p>
          ) : error ? (
            <p className="text-red-500 text-center">{error}</p>
          ) : filteredDishes.length === 0 ? (
            <p className="text-gray-600 text-center">
              {dishes.length === 0 ? "No dishes available." : "No dishes match the current search or filters."}
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentDishes.map((dish) => {
                      const pricing = calculateCartItemPricing({ price: dish.price, dishDiscount: dish.discount });
                      const dishAddonOn = !addonSettings.excludedDishIds.includes(dish._id!);
                      const catAddonOn = !addonSettings.excludedCategoryNames.includes(dish.category);
                      const effectiveAddonOn = addonSettings.globalEnabled && catAddonOn && dishAddonOn;

                      return (
                        <TableRow key={dish._id} className={dish.active ? "" : "bg-stone-50/80 text-stone-500"}>
                          <TableCell>
                            <div className="relative w-16 h-16">
                              <img
                                src={dish.image || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIeqZ7XgBsSFoHfg6AqYO8DArUUDCdrJEorw&s"}
                                alt={dish.name}
                                className={`w-16 h-16 object-cover rounded-md transition-opacity ${dish.active ? "opacity-100" : "opacity-55"}`}
                              />
                              {!dish.active && (
                                <Badge className="absolute -top-2 -right-2 border-amber-200 bg-amber-100 text-amber-800 shadow-sm">Off</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <span className={dish.active ? "text-foreground" : "text-stone-600"}>{dish.name}</span>
                              {!dish.active && (
                                <span className="text-xs font-medium uppercase tracking-wide text-amber-700">Currently not selling</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className={dish.active ? "" : "text-stone-500"}>
                            <div className="flex flex-col gap-1">
                              <span>€{dish.price.toFixed(2)}</span>
                              {pricing.unitDishDiscount > 0 && (
                                <span className="text-xs font-medium text-emerald-700">Now €{pricing.unitTotal.toFixed(2)}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {dish.discount ? (
                              <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">-{dish.discount.percentage}%</Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={dish.active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}>
                              {dish.active ? "Selling" : "Not Selling"}
                            </Badge>
                          </TableCell>
                          <TableCell>{dish.category}</TableCell>
                          <TableCell className="max-w-[200px] truncate text-sm text-stone-500">{dish.description}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="secondary"
                                size="icon"
                                onClick={() => handleSellingStatusChange(dish)}
                                aria-label={dish.active ? "Stop selling" : "Start selling"}
                              >
                                {dish.active ? <Pause /> : <Play />}
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleEdit(dish)}
                                aria-label="Edit dish"
                              >
                                <SquarePen />
                              </Button>
                              {/* Extras on/off quick toggle */}
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => toggleDishAddon(dish._id!, !dishAddonOn)}
                                aria-label={dishAddonOn ? "Disable extras for this dish" : "Enable extras for this dish"}
                                title={
                                  !addonSettings.globalEnabled
                                    ? "Extras disabled globally"
                                    : !catAddonOn
                                    ? `Extras off for category "${dish.category}"`
                                    : dishAddonOn
                                    ? "Extras on — click to disable for this dish"
                                    : "Extras off — click to enable for this dish"
                                }
                                className={effectiveAddonOn ? "border-stone-900 text-stone-900" : "border-stone-200 text-stone-300"}
                              >
                                <PlusCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => handleDelete(dish._id as string)}
                                aria-label="Delete dish"
                              >
                                <Trash2 />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)} className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink onClick={() => setCurrentPage(page)} isActive={currentPage === page} className="cursor-pointer">{page}</PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)} className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          )}

          {/* ── Edit / Create dish modal ───────────────────────────────────── */}
          {editingDish && (
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
              <DialogContent className="max-w-lg max-h-[90dvh] flex flex-col p-0 gap-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-stone-100 shrink-0">
                  <DialogTitle>{isCreateMode ? "Add Dish" : "Edit Dish"}</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                  {/* Basic fields */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <Input id="name" name="name" value={editingDish.name} onChange={handleInputChange} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="price" className="text-right">Price</Label>
                    <Input id="price" name="price" type="number" step="0.01" value={editingDish.price} onChange={handleInputChange} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">Description</Label>
                    <textarea
                      id="description"
                      name="description"
                      value={editingDish.description || ""}
                      onChange={handleInputChange}
                      className="col-span-3 min-h-20 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="discountPercentage" className="text-right">Discount %</Label>
                    <Input
                      id="discountPercentage"
                      name="discountPercentage"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={editingDish.discount?.percentage ?? ""}
                      onChange={(e) => handleDiscountChange(e.target.value)}
                      className="col-span-3"
                      placeholder="Leave empty for no discount"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="image" className="text-right">Image URL</Label>
                    <Input id="image" name="image" value={editingDish.image || ""} onChange={handleInputChange} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category" className="text-right">Category</Label>
                    <Select value={editingDish.category} onValueChange={(v) => setEditingDish({ ...editingDish, category: v })}>
                      <SelectTrigger className="col-span-3 w-full">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Active</Label>
                    <Toggle
                      pressed={editingDish.active}
                      onPressedChange={(p) => setEditingDish((prev) => ({ ...prev, active: p }) as AdminDish)}
                      className={`col-span-3 relative w-14 h-8 rounded-full cursor-pointer transition-colors ${editingDish.active ? "bg-black" : "bg-gray-400"}`}
                      aria-label="Toggle active"
                    >
                      <span
                        className="block w-6 h-6 bg-white rounded-full shadow-md pointer-events-none transition-transform"
                        style={{ transform: editingDish.active ? "translateX(24px)" : "translateX(0)" }}
                      />
                    </Toggle>
                  </div>

                  {/* ── Extras section (edit mode only) ────────────────────── */}
                  {!isCreateMode && (
                    <div className="pt-2 border-t border-stone-100">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-stone-800">Extras for this dish</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-stone-500">
                            {addonSettings.excludedDishIds.includes(editingDish._id!) ? "Off" : "On"}
                          </span>
                          <SwitchToggle
                            checked={!addonSettings.excludedDishIds.includes(editingDish._id!)}
                            onChange={(v) => toggleDishAddon(editingDish._id!, v)}
                          />
                        </div>
                      </div>

                      {!addonSettings.globalEnabled && (
                        <p className="text-xs text-red-500 mb-2">Extras are disabled globally — turn on in Extras settings.</p>
                      )}
                      {addonSettings.excludedCategoryNames.includes(editingDish.category) && (
                        <p className="text-xs text-amber-600 mb-2">Extras are off for the &ldquo;{editingDish.category}&rdquo; category.</p>
                      )}

                      {/* Per-addon toggles */}
                      {!addonSettings.excludedDishIds.includes(editingDish._id!) && (
                        <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                          {ADD_ONS.map((addon) => {
                            const excluded = (addonSettings.dishExcludedAddonIds[editingDish._id] ?? []).includes(addon.id);
                            return (
                              <div key={addon.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-stone-50 transition-colors">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{ADDON_EMOJI[addon.id] ?? "🍽"}</span>
                                  <div>
                                    <p className="text-sm font-medium text-stone-800">{addon.name}</p>
                                    <p className="text-xs text-stone-400">{addon.price === 0 ? "free" : `+€${addon.price.toFixed(2)}`}</p>
                                  </div>
                                </div>
                                <SwitchToggle
                                  checked={!excluded}
                                  onChange={(v) => toggleSingleAddonForDish(editingDish._id, addon.id, v)}
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <DialogFooter className="px-6 py-4 border-t border-stone-100 shrink-0">
                  <Button variant="outline" onClick={() => { setIsEditModalOpen(false); setEditingDish(null); setIsCreateMode(false); }}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>{isCreateMode ? "Create" : "Save"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* ── Extras settings modal (global + category) ─────────────────── */}
          <Dialog open={extrasSettingsOpen} onOpenChange={setExtrasSettingsOpen}>
            <DialogContent className="max-w-md max-h-[85dvh] flex flex-col p-0 gap-0">
              <DialogHeader className="px-6 pt-6 pb-4 border-b border-stone-100 shrink-0">
                <DialogTitle>Extras settings</DialogTitle>
                <p className="text-xs text-stone-400 mt-0.5">Control extras visibility globally and per category.</p>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                {/* Global toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-stone-50 border border-stone-100">
                  <div>
                    <p className="text-sm font-semibold text-stone-800">Enable extras globally</p>
                    <p className="text-xs text-stone-400 mt-0.5">Master switch — overrides all per-dish and per-category settings.</p>
                  </div>
                  <SwitchToggle
                    checked={addonSettings.globalEnabled}
                    onChange={(v) => saveAddonSettings({ ...addonSettings, globalEnabled: v })}
                  />
                </div>

                {/* Per-category */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3">By category</p>
                  <div className="space-y-2">
                    {categories.map((cat) => {
                      const enabled = !addonSettings.excludedCategoryNames.includes(cat.name);
                      return (
                        <div key={cat.name} className="flex items-center justify-between py-2.5 px-4 rounded-xl border border-stone-100 hover:bg-stone-50 transition-colors">
                          <div>
                            <p className="text-sm font-medium text-stone-800">{cat.name}</p>
                            {!addonSettings.globalEnabled && (
                              <p className="text-xs text-stone-400">Blocked by global off</p>
                            )}
                          </div>
                          <SwitchToggle
                            checked={enabled}
                            onChange={(v) => toggleCategoryAddon(cat.name, v)}
                            disabled={!addonSettings.globalEnabled}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-stone-100 shrink-0">
                <Button className="w-full" onClick={() => setExtrasSettingsOpen(false)}>Done</Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>
      </div>
    </>
  );
}
