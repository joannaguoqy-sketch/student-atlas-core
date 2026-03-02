import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, ArrowUp, ArrowDown, Pencil, Trash2 } from "lucide-react";
import { growthTypes as initialTypes, tags as initialTags } from "@/data/mockData";
import type { GrowthType, Tag } from "@/types";

export default function SettingsPage() {
  const [types, setTypes] = useState<GrowthType[]>([...initialTypes]);
  const [tagList, setTagList] = useState<Tag[]>([...initialTags]);

  const tagGroups = [...new Set(tagList.map((t) => t.group_name))];

  return (
    <div>
      <PageHeader title="模板与标签设置" description="配置成长记录类型和标签" />

      <div className="space-y-6">
        {/* Growth Types */}
        <div className="bg-card rounded-lg border border-border">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-card-foreground">成长记录类型管理</h3>
            <Button size="sm" variant="outline" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> 新增类型</Button>
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
                {types.sort((a, b) => a.sort_order - b.sort_order).map((t) => (
                  <tr key={t.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 text-center">
                      <input type="checkbox" checked={t.is_enabled} onChange={() => {
                        setTypes(prev => prev.map(x => x.id === t.id ? { ...x, is_enabled: !x.is_enabled } : x));
                      }} className="accent-primary" />
                    </td>
                    <td className="px-4 py-2.5 font-medium text-card-foreground">{t.display_name}</td>
                    <td className="px-4 py-2.5 text-center text-muted-foreground">{t.is_builtin ? "是" : "否"}</td>
                    <td className="px-4 py-2.5 text-center text-muted-foreground">{t.sort_order}</td>
                    <td className="px-4 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm"><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm"><ArrowUp className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm"><ArrowDown className="h-3.5 w-3.5" /></Button>
                        {!t.is_builtin && <Button variant="ghost" size="sm" className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>}
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
            <Button size="sm" variant="outline" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> 新增标签</Button>
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
                {tagList.sort((a, b) => a.sort_order - b.sort_order).map((t) => (
                  <tr key={t.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 text-center">
                      <input type="checkbox" checked={t.is_enabled} onChange={() => {
                        setTagList(prev => prev.map(x => x.id === t.id ? { ...x, is_enabled: !x.is_enabled } : x));
                      }} className="accent-primary" />
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{t.group_name}</td>
                    <td className="px-4 py-2.5 font-medium text-card-foreground">{t.display_name}</td>
                    <td className="px-4 py-2.5 text-center text-muted-foreground">{t.is_builtin ? "是" : "否"}</td>
                    <td className="px-4 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm"><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm"><ArrowUp className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm"><ArrowDown className="h-3.5 w-3.5" /></Button>
                        {!t.is_builtin && <Button variant="ghost" size="sm" className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>}
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
