"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DishInput as Dish } from "@/models/dish";
import { Toggle } from "@/components/ui/toggle";

interface Category {
  _id: string;
  name: string;
  dishes: Dish[];
}

export default function DishesPage() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);

  useEffect(() => {
    async function fetchDishes() {
      try {
        const response = await fetch("/api/v1/dishes/");
        if (!response.ok) {
          throw new Error("Failed to fetch dishes");
        }
        const { data } = await response.json();
        const flattenedDishes: Dish[] = data.flatMap((category: Category) =>
          category.dishes.map((dish) => ({
            _id: dish._id,
            name: dish.name,
            price: dish.price,
            category: category.name,
            description: dish.description,
            image: dish.image,
            active: dish.active,
          }))
        );
        setDishes(flattenedDishes);
        setLoading(false);
      } catch (err) {
        setError("Error fetching dishes");
        setLoading(false);
      }
    }
    fetchDishes();
  }, []);

  // Handle delete dish
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this dish?")) return;
    try {
      const response = await fetch(`/api/v1/dishes/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete dish");
      }
      setDishes(dishes.filter((dish) => dish._id !== id));
      // Reset to first page if current page becomes empty
      if (currentDishes.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (err) {
      alert("Error deleting dish");
    }
  };

  // Handle edit dish
  const handleEdit = (dish: Dish) => {
    setEditingDish(dish);
    setIsEditModalOpen(true);
  };

  // Handle save changes
  const handleSave = async () => {
    if (!editingDish) return;
    try {
      console.log(editingDish);
      const response = await fetch(`/api/v1/dishes/${editingDish._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editingDish.name,
          price: editingDish.price,
          description: editingDish.description,
          image: editingDish.image,
          category: editingDish.category,
          active: editingDish.active,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to update dish");
      }
      setDishes(
        dishes.map((dish) => (dish._id === editingDish._id ? { ...dish, ...editingDish } : dish))
      );
      setIsEditModalOpen(false);
      setEditingDish(null);
    } catch (err) {
      alert("Error updating dish");
    }
  };

  // Handle input changes in modal
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white p-8 rounded-xl shadow-lg max-w-4xl w-full"
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Restaurant Menu</h1>
          {loading ? (
            <p className="text-gray-600 text-center">Loading dishes...</p>
          ) : error ? (
            <p className="text-red-500 text-center">{error}</p>
          ) : dishes.length === 0 ? (
            <p className="text-gray-600 text-center">No dishes available.</p>
          ) : (
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
                      <TableRow key={dish._id}>
                        <TableCell>
                          <img
                            src={
                              dish.image ||
                              "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIeqZ7XgBsSFoHfg6AqYO8DArUUDCdrJEorw&s"
                            }
                            alt={dish.name}
                            className="w-16 h-16 object-cover"
                          />
                        </TableCell>
                        <TableCell>{dish.name}</TableCell>
                        <TableCell>€{dish.price.toFixed(2)}</TableCell>
                        <TableCell>{dish.active ? "Yes" : "No"}</TableCell>
                        <TableCell>{dish.category}</TableCell>
                        <TableCell>{dish.description}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(dish)}>
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(dish._id as string)}
                            >
                              Delete
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
                    <Label htmlFor="en_desc" className="text-right">
                      Description
                    </Label>
                    <Input
                      id="en_desc"
                      name="en_desc"
                      value={editingDish.description || ""}
                      type="textarea"
                      onChange={handleInputChange}
                      className="col-span-3"
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
                            }) as Dish
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
