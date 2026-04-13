"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Pause, Play, SquarePen, Trash2 } from "lucide-react";
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
import { Toggle } from "@/components/ui/toggle";
import {
  deleteDish,
  listAdminDishes,
  updateDish,
  updateDishSellingStatus,
} from "@/services/dishes-service";
import type { AdminDish } from "@repo-types/dishes";

export default function DishesPage() {
  const [dishes, setDishes] = useState<AdminDish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<AdminDish | null>(null);

  useEffect(() => {
    async function fetchDishes() {
      try {
        const adminDishes = await listAdminDishes();
        setDishes(adminDishes);
      } catch {
        setError("Error fetching dishes");
      } finally {
        setLoading(false);
      }
    }

    fetchDishes();
  }, []);

  // Handle delete dish
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this dish?")) return;

    const isLastItemOnPage = currentDishes.length === 1 && currentPage > 1;

    try {
      await deleteDish(id);
      setDishes((currentDishes) => currentDishes.filter((dish) => dish._id !== id));

      if (isLastItemOnPage) {
        setCurrentPage(currentPage - 1);
      }
    } catch {
      alert("Error deleting dish");
    }
  };

  // Handle edit dish
  const handleEdit = (dish: AdminDish) => {
    setEditingDish(dish);
    setIsEditModalOpen(true);
  };

  const handleSellingStatusChange = async (dish: AdminDish) => {
    const nextSellingState = !dish.active;

    setDishes((currentDishes) =>
      currentDishes.map((currentDish) =>
        currentDish._id === dish._id
          ? { ...currentDish, active: nextSellingState }
          : currentDish
      )
    );
    setEditingDish((currentDish) =>
      currentDish && currentDish._id === dish._id
        ? { ...currentDish, active: nextSellingState }
        : currentDish
    );

    try {
      await updateDishSellingStatus(dish._id, nextSellingState);
    } catch {
      setDishes((currentDishes) =>
        currentDishes.map((currentDish) =>
          currentDish._id === dish._id ? { ...currentDish, active: dish.active } : currentDish
        )
      );
      setEditingDish((currentDish) =>
        currentDish && currentDish._id === dish._id ? { ...currentDish, active: dish.active } : currentDish
      );
      alert("Error updating selling status");
    }
  };

  // Handle save changes
  const handleSave = async () => {
    if (!editingDish) return;

    try {
      await updateDish(editingDish._id, {
        name: editingDish.name,
        price: editingDish.price,
        description: editingDish.description,
        image: editingDish.image,
        category: editingDish.category,
        active: editingDish.active,
      });
      setDishes((currentDishes) =>
        currentDishes.map((dish) => (dish._id === editingDish._id ? { ...dish, ...editingDish } : dish))
      );
      setIsEditModalOpen(false);
      setEditingDish(null);
    } catch {
      alert("Error updating dish");
    }
  };

  // Handle input changes in modal
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!editingDish) return;
    const { name, value } = e.target;
    setEditingDish({
      ...editingDish,
      [name]: name === "price" ? parseFloat(value) || 0 : value,
    });
  };

  // Pagination logic
  const totalPages = Math.ceil(dishes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDishes = dishes.slice(startIndex, endIndex);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <>
      <div className="min-h-screen flex flex-col items-center bg-gray-100 p-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white p-8 rounded-xl shadow-lg w-full"
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Restaurant Menu</h1>
          {
          loading 
          ? <p className="text-gray-600 text-center">Loading dishes...</p>
          : error 
            ? <p className="text-red-500 text-center">{error}</p>
            : dishes.length === 0 
              ? <p className="text-gray-600 text-center">No dishes available.</p>
              : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentDishes.map((dish) => (
                      <TableRow
                        key={dish._id}
                        className={dish.active ? "" : "bg-stone-50/80 text-stone-500"}
                      >
                        <TableCell>
                          <div className="relative w-16 h-16">
                            <img
                              src={
                                dish.image ||
                                "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIeqZ7XgBsSFoHfg6AqYO8DArUUDCdrJEorw&s"
                              }
                              alt={dish.name}
                              className={`w-16 h-16 object-cover rounded-md transition-opacity ${
                                dish.active ? "opacity-100" : "opacity-55"
                              }`}
                            />
                            {!dish.active && (
                              <Badge className="absolute -top-2 -right-2 border-amber-200 bg-amber-100 text-amber-800 shadow-sm">
                                Off
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className={dish.active ? "text-foreground" : "text-stone-600"}>
                              {dish.name}
                            </span>
                            {!dish.active && (
                              <span className="text-xs font-medium uppercase tracking-wide text-amber-700">
                                Currently not selling
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className={dish.active ? "" : "text-stone-500"}>
                          €{dish.price.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              dish.active
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-amber-200 bg-amber-50 text-amber-700"
                            }
                          >
                            {dish.active ? "Selling" : "Not Selling"}
                          </Badge>
                        </TableCell>
                        <TableCell>{dish.category}</TableCell>
                        <TableCell>{dish.description}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="secondary"
                              size="icon"
                              onClick={() => handleSellingStatusChange(dish)}
                              aria-label={
                                dish.active ? "Stop selling this dish" : "Activate selling this dish"
                              }
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
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={handlePreviousPage}
                        className={
                          currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => handlePageChange(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={handleNextPage}
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          )}

          {/* Edit Modal */}
          {editingDish && (
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Dish</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={editingDish.name}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="price" className="text-right">
                      Price
                    </Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      value={editingDish.price}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      Description
                    </Label>
                    <textarea
                      id="description"
                      name="description"
                      value={editingDish.description || ""}
                      onChange={handleInputChange}
                      className="col-span-3 min-h-24 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="image" className="text-right">
                      Image URL
                    </Label>
                    <Input
                      id="image"
                      name="image"
                      value={editingDish.image || ""}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category" className="text-right">
                      Category
                    </Label>
                    <Input
                      id="category"
                      name="category"
                      value={editingDish.category}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                  {/* toggle button */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Active</Label>
                    <Toggle
                      pressed={editingDish.active}
                      onPressedChange={(pressed) =>
                        setEditingDish(
                          (prev) =>
                            ({
                              ...prev,
                              active: pressed,
                            }) as AdminDish
                        )
                      }
                      className={`col-span-3 relative w-14 h-8 rounded-full cursor-pointer transition-colors ${
                        editingDish.active ? "bg-black" : "bg-gray-400"
                      }`}
                      aria-label="Toggle Dish Active Status"
                    >
                      <span
                        className="block w-6 h-6 bg-white rounded-full shadow-md pointer-events-none transition-transform"
                        style={{
                          transform: editingDish.active ? "translateX(24px)" : "translateX(0)",
                        }}
                      />
                    </Toggle>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </motion.div>
      </div>
    </>
  );
}
