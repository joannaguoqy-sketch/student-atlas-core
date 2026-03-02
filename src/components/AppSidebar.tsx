import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, Users, UserCircle, FileText,
  Upload, Download, Settings, GraduationCap, BarChart3
} from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "学院总览" },
  { to: "/courses", icon: BookOpen, label: "课程中心" },
  { to: "/sections", icon: Users, label: "教学班管理" },
  { to: "/analysis", icon: BarChart3, label: "班级分析" },
  { to: "/students", icon: UserCircle, label: "学生中心" },
  { to: "/import", icon: Upload, label: "数据导入" },
  { to: "/export", icon: Download, label: "报告导出" },
  { to: "/settings", icon: Settings, label: "模板与标签设置" },
];

export default function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="w-60 min-h-screen sidebar-gradient flex flex-col border-r border-sidebar-border">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-sidebar-border">
        <GraduationCap className="h-7 w-7 text-sidebar-primary" />
        <div>
          <h1 className="text-sm font-bold text-sidebar-accent-foreground leading-tight">大学英语课程</h1>
          <p className="text-[11px] text-sidebar-foreground/60">学生成长评价与管理平台</p>
        </div>
      </div>
      <nav className="flex-1 py-3 px-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to ||
            (item.to !== "/" && location.pathname.startsWith(item.to));
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon className={`h-[18px] w-[18px] ${isActive ? "text-sidebar-primary" : ""}`} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="px-5 py-4 border-t border-sidebar-border">
        <p className="text-[11px] text-sidebar-foreground/40">当前学期: 2025-2026-2</p>
      </div>
    </aside>
  );
}
