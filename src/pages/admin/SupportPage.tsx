import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { PlusCircle, Edit, Trash2 } from "lucide-react";

// --- Contact Info Manager ---
const contactSchema = z.object({
  contact_address: z.string().min(1, "Địa chỉ không được để trống."),
  contact_email: z.string().email("Email không hợp lệ."),
  contact_phone: z.string().min(1, "Số điện thoại không được để trống."),
});
type ContactFormValues = z.infer<typeof contactSchema>;

const ContactManager = () => {
  const [loading, setLoading] = useState(true);
  const form = useForm<ContactFormValues>({ resolver: zodResolver(contactSchema) });

  useEffect(() => {
    const fetchContactInfo = async () => {
      setLoading(true);
      const { data } = await supabase.from('system_settings').select('key, value').in('key', ['contact_address', 'contact_email', 'contact_phone']);
      const settings = data?.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {} as any) || {};
      form.reset(settings);
      setLoading(false);
    };
    fetchContactInfo();
  }, [form]);

  const onSubmit = async (data: ContactFormValues) => {
    const toastId = showLoading("Đang lưu...");
    const updates = Object.entries(data).map(([key, value]) => supabase.from('system_settings').upsert({ key, value }));
    const results = await Promise.all(updates);
    dismissToast(toastId);
    if (results.some(r => r.error)) showError("Lưu thất bại.");
    else showSuccess("Lưu thành công!");
  };

  if (loading) return <Skeleton className="h-48 w-full" />;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="contact_address" render={({ field }) => <FormItem><FormLabel>Địa chỉ</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
        <FormField control={form.control} name="contact_email" render={({ field }) => <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
        <FormField control={form.control} name="contact_phone" render={({ field }) => <FormItem><FormLabel>Số điện thoại</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
        <Button type="submit">Lưu thay đổi</Button>
      </form>
    </Form>
  );
};

// --- FAQ Manager ---
const faqSchema = z.object({ question: z.string().min(1), answer: z.string().min(1) });
type FaqFormValues = z.infer<typeof faqSchema>;
type Faq = { id: number; question: string; answer: string; };

const FaqManager = () => {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogState, setDialogState] = useState<{ type: 'add' | 'edit' | null; data?: Faq }>({ type: null });
  const form = useForm<FaqFormValues>({ resolver: zodResolver(faqSchema) });

  const fetchFaqs = async () => {
    setLoading(true);
    const { data } = await supabase.from('faqs').select('*').order('display_order');
    setFaqs(data || []);
    setLoading(false);
  };
  useEffect(() => { fetchFaqs(); }, []);

  const handleSave = async (values: FaqFormValues) => {
    const toastId = showLoading("Đang lưu...");
    const { error } = dialogState.type === 'add'
      ? await supabase.from('faqs').insert(values)
      : await supabase.from('faqs').update(values).eq('id', dialogState.data!.id);
    dismissToast(toastId);
    if (error) showError("Lưu thất bại.");
    else {
      showSuccess("Lưu thành công!");
      setDialogState({ type: null });
      fetchFaqs();
    }
  };

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from('faqs').delete().eq('id', id);
    if (error) showError("Xóa thất bại.");
    else {
      showSuccess("Xóa thành công!");
      fetchFaqs();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => { form.reset(); setDialogState({ type: 'add' }); }}>
          <PlusCircle className="mr-2 h-4 w-4" /> Thêm FAQ
        </Button>
      </div>
      <Table>
        <TableHeader><TableRow><TableHead>Câu hỏi</TableHead><TableHead className="text-right">Hành động</TableHead></TableRow></TableHeader>
        <TableBody>
          {faqs.map(faq => (
            <TableRow key={faq.id}>
              <TableCell className="font-medium">{faq.question}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => { form.reset(faq); setDialogState({ type: 'edit', data: faq }); }}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(faq.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={!!dialogState.type} onOpenChange={(open) => !open && setDialogState({ type: null })}>
        <DialogContent>
          <DialogHeader><DialogTitle>{dialogState.type === 'add' ? 'Thêm FAQ' : 'Sửa FAQ'}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4 py-4">
              <FormField control={form.control} name="question" render={({ field }) => <FormItem><FormLabel>Câu hỏi</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
              <FormField control={form.control} name="answer" render={({ field }) => <FormItem><FormLabel>Câu trả lời</FormLabel><FormControl><Textarea {...field} rows={5} /></FormControl><FormMessage /></FormItem>} />
              <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Hủy</Button></DialogClose><Button type="submit">Lưu</Button></DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// --- User Guide Manager ---
const guideSchema = z.object({ title: z.string().min(1), content: z.string().min(1) });
type GuideFormValues = z.infer<typeof guideSchema>;
type Guide = { id: number; title: string; content: string; };

const UserGuideManager = () => {
    const [guides, setGuides] = useState<Guide[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogState, setDialogState] = useState<{ type: 'add' | 'edit' | null; data?: Guide }>({ type: null });
    const form = useForm<GuideFormValues>({ resolver: zodResolver(guideSchema) });
  
    const fetchGuides = async () => {
      setLoading(true);
      const { data } = await supabase.from('user_guide_sections').select('*').order('display_order');
      setGuides(data || []);
      setLoading(false);
    };
    useEffect(() => { fetchGuides(); }, []);
  
    const handleSave = async (values: GuideFormValues) => {
      const toastId = showLoading("Đang lưu...");
      const { error } = dialogState.type === 'add'
        ? await supabase.from('user_guide_sections').insert(values)
        : await supabase.from('user_guide_sections').update(values).eq('id', dialogState.data!.id);
      dismissToast(toastId);
      if (error) showError("Lưu thất bại.");
      else {
        showSuccess("Lưu thành công!");
        setDialogState({ type: null });
        fetchGuides();
      }
    };
  
    const handleDelete = async (id: number) => {
      const { error } = await supabase.from('user_guide_sections').delete().eq('id', id);
      if (error) showError("Xóa thất bại.");
      else {
        showSuccess("Xóa thành công!");
        fetchGuides();
      }
    };
  
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={() => { form.reset(); setDialogState({ type: 'add' }); }}>
            <PlusCircle className="mr-2 h-4 w-4" /> Thêm Mục
          </Button>
        </div>
        <Table>
          <TableHeader><TableRow><TableHead>Tiêu đề</TableHead><TableHead className="text-right">Hành động</TableHead></TableRow></TableHeader>
          <TableBody>
            {guides.map(guide => (
              <TableRow key={guide.id}>
                <TableCell className="font-medium">{guide.title}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => { form.reset(guide); setDialogState({ type: 'edit', data: guide }); }}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(guide.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Dialog open={!!dialogState.type} onOpenChange={(open) => !open && setDialogState({ type: null })}>
          <DialogContent>
            <DialogHeader><DialogTitle>{dialogState.type === 'add' ? 'Thêm Mục' : 'Sửa Mục'}</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4 py-4">
                <FormField control={form.control} name="title" render={({ field }) => <FormItem><FormLabel>Tiêu đề</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={form.control} name="content" render={({ field }) => <FormItem><FormLabel>Nội dung</FormLabel><FormControl><Textarea {...field} rows={10} /></FormControl><FormMessage /></FormItem>} />
                <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Hủy</Button></DialogClose><Button type="submit">Lưu</Button></DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

// --- Main Page ---
const AdminSupportPage = () => {
  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-6">Quản lý Hỗ trợ</h1>
      <Tabs defaultValue="contact">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="contact">Thông tin Liên hệ</TabsTrigger>
          <TabsTrigger value="faq">Hỏi & Đáp (FAQ)</TabsTrigger>
          <TabsTrigger value="guide">Hướng dẫn sử dụng</TabsTrigger>
        </TabsList>
        <TabsContent value="contact" className="mt-6">
          <Card><CardHeader><CardTitle>Chỉnh sửa Thông tin Liên hệ</CardTitle></CardHeader><CardContent><ContactManager /></CardContent></Card>
        </TabsContent>
        <TabsContent value="faq" className="mt-6">
          <Card><CardHeader><CardTitle>Quản lý Câu hỏi Thường gặp</CardTitle></CardHeader><CardContent><FaqManager /></CardContent></Card>
        </TabsContent>
        <TabsContent value="guide" className="mt-6">
          <Card><CardHeader><CardTitle>Quản lý Hướng dẫn Sử dụng</CardTitle></CardHeader><CardContent><UserGuideManager /></CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSupportPage;