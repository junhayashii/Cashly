"use client";

import {
  LayoutDashboard,
  Receipt,
  BarChart3,
  Wallet,
  Tag,
  Settings,
  PiggyBank,
  Menu,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const mainMenuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Transactions", url: "/transactions", icon: Receipt },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Accounts", url: "/accounts", icon: Wallet },
  { title: "Budgets & Goals", url: "/budgets", icon: PiggyBank },
  { title: "Categories", url: "/categories", icon: Tag },
];

const settingsItem = { title: "Settings", url: "/settings", icon: Settings };

const AppSidebar = () => {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const isMobile = useIsMobile();
  const pathname = usePathname();

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden fixed top-4 left-4 z-50"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <div className="flex flex-col h-full py-4">
            <SidebarHeader className="border-b border-sidebar-border pb-4">
              <div className="flex items-center gap-3 px-4">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent">
                  <Wallet className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  FinanceHub
                </h1>
              </div>
            </SidebarHeader>

            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {mainMenuItems.map((item) => {
                    const isActive = pathname === item.url;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          size="lg"
                          tooltip={item.title}
                          isActive={isActive}
                        >
                          <Link href={item.url}>
                            <item.icon className="h-5 w-5" />
                            {!isCollapsed && (
                              <span className="text-base">{item.title}</span>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarFooter className="mt-auto border-t border-sidebar-border pt-4">
              <SidebarMenu>
                <SidebarMenuItem>
                  {(() => {
                    const isActive = pathname === settingsItem.url;
                    return (
                      <SidebarMenuButton
                        asChild
                        size="lg"
                        isActive={isActive}
                        tooltip={settingsItem.title}
                      >
                        <Link href={settingsItem.url}>
                          <settingsItem.icon className="h-5 w-5" />
                          {!isCollapsed && (
                            <span className="text-base">
                              {settingsItem.title}
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    );
                  })()}
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarFooter>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarHeader className="border-b border-sidebar-border pb-4">
          <div className="flex items-center gap-3 px-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            {!isCollapsed && (
              <h1 className="text-xl font-bold text-sidebar-foreground">
                FinanceHub
              </h1>
            )}
          </div>
        </SidebarHeader>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      size="lg"
                      isActive={isActive}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-5 w-5" />
                        {!isCollapsed && (
                          <span className="text-base">{item.title}</span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarFooter className="mt-auto border-t border-sidebar-border pt-4">
          <SidebarMenu>
            <SidebarMenuItem>
              {(() => {
                const isActive = pathname === settingsItem.url;
                return (
                  <SidebarMenuButton
                    asChild
                    tooltip={settingsItem.title}
                    size="lg"
                    isActive={isActive}
                  >
                    <Link href={settingsItem.url}>
                      <settingsItem.icon className="h-5 w-5" />
                      {!isCollapsed && (
                        <span className="text-base">{settingsItem.title}</span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                );
              })()}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
