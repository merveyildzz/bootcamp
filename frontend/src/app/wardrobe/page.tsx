"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { Plus, Trash2, Camera, Type, Shirt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

type WardrobeItem = {
  id: string;
  category: string;
  description: string;
  image_url?: string;
  created_at: string;
};

const CATEGORIES = ["Üst Giyim", "Alt Giyim", "Dış Giyim", "Ayakkabı", "Aksesuar"];

export default function WardrobePage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("Üst Giyim");
  const [description, setDescription] = useState("");
  const [imageBase64, setImageBase64] = useState<string>("");

  const { data: items, isLoading } = useQuery<WardrobeItem[]>({
    queryKey: ["wardrobe"],
    queryFn: async () => {
      const res = await apiClient.get("/wardrobe");
      return res.data;
    },
  });

  const addItemMutation = useMutation({
    mutationFn: (newItem: { category: string; description: string; image_url?: string }) =>
      apiClient.post("/wardrobe", newItem),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wardrobe"] });
      setOpen(false);
      setDescription("");
      setImageBase64("");
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/wardrobe/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wardrobe"] });
    },
  });

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Create an image element to draw onto canvas
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          // Compress to JPEG with 0.7 quality
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
          setImageBase64(compressedBase64);

          // Otomatik bir açıklama yaz
          if (!description) setDescription("Kameradan eklenen eşya");
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdd = () => {
    if (!description) return;
    addItemMutation.mutate({ category, description, image_url: imageBase64 });
  };

  const groupedItems = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = items?.filter((i) => i.category === cat) || [];
    return acc;
  }, {} as Record<string, WardrobeItem[]>);

  return (
    <div className="flex flex-col min-h-full">
      <div className="p-4 border-b bg-white flex justify-between items-center shadow-sm sticky top-0 z-10">
        <h2 className="font-semibold text-lg">Sanal Dolabım</h2>
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger>
            <Button size="sm" className="h-8 rounded-full">
              <Plus className="w-4 h-4 mr-1" /> Ekle
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <div className="mx-auto w-full max-w-sm">
              <DrawerHeader>
                <DrawerTitle>Dolaba Eşya Ekle</DrawerTitle>
                <DrawerDescription>Fotoğraf çekerek veya yazı yazarak eşya ekleyin.</DrawerDescription>
              </DrawerHeader>
              <div className="p-4 pb-0 flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                        category === cat ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Örn: Siyah deri ceket"
                    className="pr-10"
                  />
                  <Type className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
                </div>

                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {imageBase64 ? (
                        <img src={imageBase64} alt="Preview" className="h-24 object-contain rounded-md" />
                      ) : (
                        <>
                          <Camera className="w-8 h-8 mb-2 text-slate-500" />
                          <p className="text-sm text-slate-500 font-semibold">Fotoğraf Çek / Seç</p>
                        </>
                      )}
                    </div>
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageCapture} />
                  </label>
                </div>
              </div>
              <DrawerFooter>
                <Button onClick={handleAdd} disabled={!description || addItemMutation.isPending}>
                  {addItemMutation.isPending ? "Ekleniyor..." : "Dolaba Kaydet"}
                </Button>
                <DrawerClose>
                  <Button variant="outline">İptal</Button>
                </DrawerClose>
              </DrawerFooter>
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      <div className="p-4 space-y-6 pb-24">
        {isLoading ? (
          <div className="text-center text-slate-400 mt-10">Yükleniyor...</div>
        ) : items?.length === 0 ? (
          <div className="text-center text-slate-400 mt-10 text-sm">
            Dolabın şu an boş. Hemen yeni eşyalar ekle!
          </div>
        ) : (
          CATEGORIES.map((cat) => {
            const catItems = groupedItems[cat];
            if (catItems.length === 0) return null;
            return (
              <div key={cat} className="space-y-3">
                <h3 className="font-medium text-slate-700 text-sm">{cat} ({catItems.length})</h3>
                <div className="grid grid-cols-2 gap-3">
                  {catItems.map((item) => (
                    <Card key={item.id} className="overflow-hidden relative group">
                      {item.image_url ? (
                        <div className="h-24 w-full bg-slate-100 relative">
                          <img src={item.image_url} alt={item.description} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="h-16 w-full bg-slate-100 flex items-center justify-center">
                          <Shirt className="w-6 h-6 text-slate-300" />
                        </div>
                      )}
                      <CardContent className="p-2 bg-white">
                        <p className="text-xs font-medium text-slate-800 line-clamp-2">{item.description}</p>
                      </CardContent>
                      <button
                        onClick={() => deleteItemMutation.mutate(item.id)}
                        className="absolute top-1 right-1 p-1.5 bg-white/80 backdrop-blur-sm rounded-full text-red-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
