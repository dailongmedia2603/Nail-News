import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type State = { id: number; name: string; };
type City = { id: number; name: string; state_id: number; };

const CategoriesPage = () => {
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogState, setDialogState] = useState<{ type: 'addState' | 'editState' | 'addCity' | 'editCity' | null, data?: any }>({ type: null });
  const [formData, setFormData] = useState<{ name?: string, state_id?: number }>({});

  const fetchData = async () => {
    setLoading(true);
    const { data: statesData, error: statesError } = await supabase.from('states').select('*').order('name');
    const { data: citiesData, error: citiesError } = await supabase.from('cities').select('*').order('name');
    if (statesError || citiesError) showError("Không thể tải danh mục.");
    else {
      setStates(statesData || []);
      setCities(citiesData || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    const toastId = showLoading("Đang lưu...");
    let error;
    if (dialogState.type === 'addState') {
      ({ error } = await supabase.from('states').insert({ name: formData.name }));
    } else if (dialogState.type === 'editState') {
      ({ error } = await supabase.from('states').update({ name: formData.name }).eq('id', dialogState.data.id));
    } else if (dialogState.type === 'addCity') {
      ({ error } = await supabase.from('cities').insert({ name: formData.name, state_id: formData.state_id }));
    } else if (dialogState.type === 'editCity') {
      ({ error } = await supabase.from('cities').update({ name: formData.name, state_id: formData.state_id }).eq('id', dialogState.data.id));
    }
    dismissToast(toastId);
    if (error) showError("Lưu thất bại: " + error.message);
    else {
      showSuccess("Lưu thành công!");
      setDialogState({ type: null });
      fetchData();
    }
  };

  const handleDelete = async (type: 'state' | 'city', id: number) => {
    const table = type === 'state' ? 'states' : 'cities';
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) showError("Xóa thất bại: " + error.message);
    else {
      showSuccess("Xóa thành công!");
      fetchData();
    }
  };

  const stateMap = new Map(states.map(s => [s.id, s.name]));

  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-6">Quản lý Danh mục Địa lý</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Tiểu bang</CardTitle>
            <Button size="sm" onClick={() => { setFormData({}); setDialogState({ type: 'addState' }); }}>
              <PlusCircle className="mr-2 h-4 w-4" /> Thêm Tiểu bang
            </Button>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {states.map(state => (
                <li key={state.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                  <span>{state.name}</span>
                  <div className="space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => { setFormData({ name: state.name }); setDialogState({ type: 'editState', data: state }); }}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete('state', state.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Thành phố</CardTitle>
            <Button size="sm" onClick={() => { setFormData({}); setDialogState({ type: 'addCity' }); }}>
              <PlusCircle className="mr-2 h-4 w-4" /> Thêm Thành phố
            </Button>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {cities.map(city => (
                <li key={city.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                  <span>{city.name} <span className="text-xs text-muted-foreground">({stateMap.get(city.state_id)})</span></span>
                  <div className="space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => { setFormData({ name: city.name, state_id: city.state_id }); setDialogState({ type: 'editCity', data: city }); }}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete('city', city.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogState.type !== null} onOpenChange={(open) => !open && setDialogState({ type: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogState.type?.includes('add') ? 'Thêm mới' : 'Chỉnh sửa'} {dialogState.type?.includes('State') ? 'Tiểu bang' : 'Thành phố'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="name">Tên</Label>
              <Input id="name" value={formData.name || ''} onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))} />
            </div>
            {dialogState.type?.includes('City') && (
              <div>
                <Label htmlFor="state">Tiểu bang</Label>
                <Select value={formData.state_id?.toString()} onValueChange={(value) => setFormData(f => ({ ...f, state_id: parseInt(value) }))}>
                  <SelectTrigger id="state"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {states.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
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

export default CategoriesPage;