import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

type Tag = { id: number; name: string; };

const TagsPage = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogState, setDialogState] = useState<{ type: 'add' | 'edit' | null, data?: Tag }>({ type: null });
  const [tagName, setTagName] = useState('');

  const fetchTags = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('tags').select('*').order('name');
    if (error) showError("Không thể tải danh sách tag.");
    else setTags(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchTags(); }, []);

  const handleSave = async () => {
    if (!tagName.trim()) {
      showError("Tên tag không được để trống.");
      return;
    }
    const toastId = showLoading("Đang lưu...");
    let error;
    if (dialogState.type === 'add') {
      ({ error } = await supabase.from('tags').insert({ name: tagName }));
    } else if (dialogState.type === 'edit' && dialogState.data) {
      ({ error } = await supabase.from('tags').update({ name: tagName }).eq('id', dialogState.data.id));
    }
    dismissToast(toastId);
    if (error) {
      showError("Lưu thất bại: " + error.message);
    } else {
      showSuccess("Lưu thành công!");
      setDialogState({ type: null });
      fetchTags();
    }
  };

  const handleDelete = async (tagId: number) => {
    const { error } = await supabase.from('tags').delete().eq('id', tagId);
    if (error) showError("Xóa thất bại: " + error.message);
    else {
      showSuccess("Xóa thành công!");
      fetchTags();
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Quản lý Tag & Từ khóa</h1>
        <Button onClick={() => { setTagName(''); setDialogState({ type: 'add' }); }}>
          <PlusCircle className="mr-2 h-4 w-4" /> Thêm Tag mới
        </Button>
      </div>
      <Card>
        <CardHeader><CardTitle>Danh sách Tag</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <ul className="space-y-2">
              {tags.map(tag => (
                <li key={tag.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                  <span>{tag.name}</span>
                  <div className="space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => { setTagName(tag.name); setDialogState({ type: 'edit', data: tag }); }}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(tag.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogState.type !== null} onOpenChange={(open) => !open && setDialogState({ type: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogState.type === 'add' ? 'Thêm Tag mới' : 'Chỉnh sửa Tag'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="name">Tên Tag</Label>
            <Input id="name" value={tagName} onChange={(e) => setTagName(e.target.value)} className="mt-2" />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Hủy</Button></DialogClose>
            <Button onClick={handleSave}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TagsPage;