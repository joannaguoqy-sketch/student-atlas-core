import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, ArrowUp, ArrowDown, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";

interface GrowthTypeRow {
  id: string; key: string; display_name: string; is_builtin: boolean; is_enabled: boolean; sort_order: number;
}
interface TagRow {
  id: string; key: string; display_name: string; group_name: string; is_builtin: boolean; is_enabled: boolean; sort_order: number;
}

export default function SettingsPage() {
  const [types, setTypes] = useState<GrowthTypeRow[]>([]);
  const [tagList, setTagList] = useState<TagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingType, setEditingType] = useState<string | null>(null);
  const [editTypeName, setEditTypeName] = useState("");
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editTagName, setEditTagName] = useState("");
  const [newTypeOpen, setNewTypeOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTagOpen, setNewTagOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagGroup, setNewTagGroup] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const [{ data: gt }, { data: tg }] = await Promise.all([
      supabase.from("growth_types").select("*").order("sort_order"),
      supabase.from("tags").select("*").order("sort_order"),
    ]);
    setTypes(gt || []);
    setTagList(tg || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const toggleTypeEnabled = async (id: string, enabled: boolean) => {
    await supabase.from("growth_types").update({ is_enabled: !enabled }).eq("id", id);
    fetchData();
  };

  const toggleTagEnabled = async (id: string, enabled: boolean) => {
    await supabase.from("tags").update({ is_enabled: !enabled }).eq("id", id);
    fetchData();
  };

  const saveTypeRename = async (id: string) => {
    if (!editTypeName.trim()) return;
    const { error } = await supabase.from("growth_types").update({ display_name: editTypeName.trim() }).eq("id", id);
    if (error) toast({ title: "更新失败", description: error.message, variant: "destructive" });
    else { toast({ title: "已更新" }); setEditingType(null); fetchData(); }
  };

  const saveTagRename = async (id: string) => {
    if (!editTagName.trim()) return;
    const { error } = await supabase.from("tags").update({ display_name: editTagName.trim() }).eq("id", id);
    if (error) toast({ title: "更新失败", description: error.message, variant: "destructive" });
    else { toast({ title: "已更新" }); setEditingTag(null); fetchData(); }
  };

  const moveType = async (id: string, dir: -1 | 1) => {
    const sorted = [...types].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((t) => t.id === id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx], b = sorted[swapIdx];
    await Promise.all([
      supabase.from("growth_types").update({ sort_order: b.sort_order }).eq("id", a.id),
      supabase.from("growth_types").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    fetchData();
  };

  const moveTag = async (id: string, dir: -1 | 1) => {
    const sorted = [...tagList].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((t) => t.id === id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx], b = sorted[swapIdx];
    await Promise.all([
      supabase.from("tags").update({ sort_order: b.sort_order }).eq("id", a.id),
      supabase.from("tags").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    fetchData();
  };

  const deleteType = async (id: string) => {
    await supabase.from("growth_types").delete().eq("id", id);
    toast({ title: "已删除" });
    fetchData();
  };

  const deleteTag = async (id: string) => {
    await supabase.from("tags").delete().eq("id", id);
    toast({ title: "已删除" });
    fetchData();
  };

  const addType = async () => {
    if (!newTypeName.trim()) return;
    const maxOrder = types.reduce((m, t) => Math.max(m, t.sort_order), 0);
    const key = newTypeName.trim().toLowerCase().replace(/\s+/g, "_");
    const { error } = await supabase.from("growth_types").insert({
      key, display_name: newTypeName.trim(), is_builtin: false, is_enabled: true, sort_order: maxOrder + 1,
    });
    if (error) toast({ title: "创建失败", description: error.message, variant: "destructive" });
    else { toast({ title: "已创建" }); setNewTypeOpen(false); setNewTypeName(""); fetchData(); }
  };

  const addTag = async () => {
    if (!newTagName.trim() || !newTagGroup.trim()) return;
    const maxOrder = tagList.reduce((m, t) => Math.max(m, t.sort_order), 0);
    const key = newTagName.trim().toLowerCase().replace(/\s+/g, "_");
    const { error } = await supabase.from("tags").insert({
      key, display_name: newTagName.trim(), group_name: newTagGroup.trim(),
      is_builtin: false, is_enabled: true, sort_order: maxOrder + 1,
    });
    if (error) toast({ title: "创建失败", description: error.message, variant: "destructive" });
    else { toast({ title: "已创建" }); setNewTagOpen(false); setNewTagName(""); setNewTagGroup(""); fetchData(); }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="模板与标签设置" description="配置成长记录类型和标签（实时持久化）" />
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="模板与标签设置" description="配置成长记录类型和标签（实时持久化）" />
      <div className="space-y-6">
        {/* Growth Types */}
        <div className="bg-card rounded-lg border border-border">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-card-foreground">成长记录类型管理</h3>
            <Dialog open={newTypeOpen} onOpenChange={setNewTypeOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> 新增类型</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>新增成长记录类型</DialogTitle></DialogHeader>
                <Input placeholder="类型名称" value={newTypeName} onChange={(e) => setNewTypeName(e.target.value)} />
                <DialogFooter>
                  <Button onClick={addType} disabled={!newTypeName.trim()}>确认</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-center px-4 py-2.5 font-medium text-muted-foreground w-16">启用</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">显示名</th>
                  <th className="text-center px-4 py-2.5 font-medium text-muted-foreground w-16">内置</th>
                  <th className="text-center px-4 py-2.5 font-medium text-muted-foreground w-16">排序</th>
                  <th className="text-center px-4 py-2.5 font-medium text-muted-foreground w-32">操作</th>
                </tr>
              </thead>
              <tbody>
                {types.map((t) => (
                  <tr key={t.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 text-center">
                      <input type="checkbox" checked={t.is_enabled} onChange={() => toggleTypeEnabled(t.id, t.is_enabled)} className="accent-primary" />
                    </td>
                    <td className="px-4 py-2.5 font-medium text-card-foreground">
                      {editingType === t.id ? (
                        <div className="flex items-center gap-1">
                          <Input value={editTypeName} onChange={(e) => setEditTypeName(e.target.value)} className="h-7 w-32 text-sm" autoFocus
                            onKeyDown={(e) => { if (e.key === "Enter") saveTypeRename(t.id); if (e.key === "Escape") setEditingType(null); }} />
                          <Button variant="ghost" size="sm" onClick={() => saveTypeRename(t.id)}><Check className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => setEditingType(null)}><X className="h-3.5 w-3.5" /></Button>
                        </div>
                      ) : t.display_name}
                    </td>
                    <td className="px-4 py-2.5 text-center text-muted-foreground">{t.is_builtin ? "是" : "否"}</td>
                    <td className="px-4 py-2.5 text-center text-muted-foreground">{t.sort_order}</td>
                    <td className="px-4 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setEditingType(t.id); setEditTypeName(t.display_name); }}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => moveType(t.id, -1)}><ArrowUp className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => moveType(t.id, 1)}><ArrowDown className="h-3.5 w-3.5" /></Button>
                        {!t.is_builtin && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>确认删除？</AlertDialogTitle>
                                <AlertDialogDescription>将删除类型「{t.display_name}」</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>取消</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteType(t.id)}>确认</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tags */}
        <div className="bg-card rounded-lg border border-border">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-card-foreground">标签管理</h3>
            <Dialog open={newTagOpen} onOpenChange={setNewTagOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> 新增标签</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>新增标签</DialogTitle></DialogHeader>
                <Input placeholder="标签名称" value={newTagName} onChange={(e) => setNewTagName(e.target.value)} className="mb-2" />
                <Input placeholder="分组名称" value={newTagGroup} onChange={(e) => setNewTagGroup(e.target.value)} />
                <DialogFooter>
                  <Button onClick={addTag} disabled={!newTagName.trim() || !newTagGroup.trim()}>确认</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-center px-4 py-2.5 font-medium text-muted-foreground w-16">启用</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">分组</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">显示名</th>
                  <th className="text-center px-4 py-2.5 font-medium text-muted-foreground w-16">内置</th>
                  <th className="text-center px-4 py-2.5 font-medium text-muted-foreground w-32">操作</th>
                </tr>
              </thead>
              <tbody>
                {tagList.map((t) => (
                  <tr key={t.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 text-center">
                      <input type="checkbox" checked={t.is_enabled} onChange={() => toggleTagEnabled(t.id, t.is_enabled)} className="accent-primary" />
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{t.group_name}</td>
                    <td className="px-4 py-2.5 font-medium text-card-foreground">
                      {editingTag === t.id ? (
                        <div className="flex items-center gap-1">
                          <Input value={editTagName} onChange={(e) => setEditTagName(e.target.value)} className="h-7 w-32 text-sm" autoFocus
                            onKeyDown={(e) => { if (e.key === "Enter") saveTagRename(t.id); if (e.key === "Escape") setEditingTag(null); }} />
                          <Button variant="ghost" size="sm" onClick={() => saveTagRename(t.id)}><Check className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => setEditingTag(null)}><X className="h-3.5 w-3.5" /></Button>
                        </div>
                      ) : t.display_name}
                    </td>
                    <td className="px-4 py-2.5 text-center text-muted-foreground">{t.is_builtin ? "是" : "否"}</td>
                    <td className="px-4 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setEditingTag(t.id); setEditTagName(t.display_name); }}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => moveTag(t.id, -1)}><ArrowUp className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => moveTag(t.id, 1)}><ArrowDown className="h-3.5 w-3.5" /></Button>
                        {!t.is_builtin && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>确认删除？</AlertDialogTitle>
                                <AlertDialogDescription>将删除标签「{t.display_name}」</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>取消</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteTag(t.id)}>确认</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
