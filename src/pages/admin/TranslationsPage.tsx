import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit } from "lucide-react";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

type Translation = { key: string; vi: string | null; en: string | null; };
type GroupedTranslations = { [group: string]: Translation[] };

const TranslationsPage = () => {
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogState, setDialogState] = useState<{ type: 'add' | 'edit' | null, data?: Translation }>({ type: null });
  const [formData, setFormData] = useState<Translation>({ key: '', vi: '', en: '' });

  const fetchTranslations = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('translations').select('*').order('key');
    if (error) showError("Không thể tải danh sách dịch thuật.");
    else setTranslations(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchTranslations(); }, []);

  const groupedTranslations = useMemo(() => {
    return translations.reduce((acc: GroupedTranslations, item) => {
      const group = item.key.split('.')[0] || 'general';
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(item);
      return acc;
    }, {});
  }, [translations]);

  const handleSave = async () => {
    if (!formData.key.trim()) {
      showError("Mã tham chiếu (key) không được để trống.");
      return;
    }
    const toastId = showLoading("Đang lưu...");
    const { error } = await supabase.from('translations').upsert(formData);
    dismissToast(toastId);
    if (error) {
      showError("Lưu thất bại: " + error.message);
    } else {
      showSuccess("Lưu thành công!");
      setDialogState({ type: null });
      fetchTranslations();
    }
  };

  const openDialog = (type: 'add' | 'edit', data?: Translation) => {
    setFormData(data || { key: '', vi: '', en: '' });
    setDialogState({ type, data });
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Quản lý Dịch thuật</h1>
        <Button onClick={() => openDialog('add')}>
          <PlusCircle className="mr-2 h-4 w-4" /> Thêm bản dịch mới
        </Button>
      </div>
      <Card>
        <CardHeader><CardTitle>Từ điển Hệ thống</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <Accordion type="multiple" className="w-full">
              {Object.entries(groupedTranslations).map(([group, items]) => (
                <AccordionItem key={group} value={group}>
                  <AccordionTrigger className="text-lg font-semibold capitalize">{group.replace(/Page$/, ' Page')}</AccordionTrigger>
                  <AccordionContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-1/3">Mã tham chiếu (Key)</TableHead>
                          <TableHead className="w-1/3">Tiếng Việt</TableHead>
                          <TableHead className="w-1/3">Tiếng Anh</TableHead>
                          <TableHead className="text-right">Hành động</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map(t => (
                          <TableRow key={t.key}>
                            <TableCell className="font-mono">{t.key}</TableCell>
                            <TableCell>{t.vi}</TableCell>
                            <TableCell>{t.en}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => openDialog('edit', t)}><Edit className="h-4 w-4" /></Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogState.type !== null} onOpenChange={(open) => !open && setDialogState({ type: null })}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{dialogState.type === 'add' ? 'Thêm bản dịch mới' : 'Chỉnh sửa bản dịch'}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="key">Mã tham chiếu (Key)</Label>
              <Input id="key" value={formData.key} onChange={(e) => setFormData(f => ({ ...f, key: e.target.value }))} disabled={dialogState.type === 'edit'} />
            </div>
            <div>
              <Label htmlFor="vi">Tiếng Việt</Label>
              <Textarea id="vi" value={formData.vi || ''} onChange={(e) => setFormData(f => ({ ...f, vi: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="en">Tiếng Anh</Label>
              <Textarea id="en" value={formData.en || ''} onChange={(e) => setFormData(f => ({ ...f, en: e.target.value }))} />
            </div>
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

export default TranslationsPage;