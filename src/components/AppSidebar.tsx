"use client";

import { useState, useEffect } from "react";
import { Wallet, Settings, Menu, Bell } from "lucide-react";
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
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

import { mainMenuItems } from "@/constants";
import { useUnreadNotifications } from "@/hooks/useNotifications";
import { supabase } from "@/lib/supabaseClient";

const settingsItem = { title: "Settings", url: "/settings", icon: Settings };
const notificationItem = {
  title: "Notifications",
  url: "/notifications",
  icon: Bell,
};

const useCurrentUserId = () => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error("Error fetching user:", error);
        return;
      }

      if (user) setUserId(user.id);
    };

    fetchUser();
  }, []);

  return userId;
};

const AppSidebar = () => {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const isMobile = useIsMobile();
  const pathname = usePathname();

  const userId = useCurrentUserId();
  const { notifications, unreadCount, setNotifications } =
    useUnreadNotifications(userId);

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
                <div className="p-2 rounded-xl bg-primary">
                  <Wallet className="h-5 w-5 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold text-primary">FinanceHub</h1>
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
        <SidebarHeader className="border-sidebar-border py-4">
          <div
            className={`flex items-center px-4 ${
              isCollapsed ? "justify-center gap-0" : "justify-between"
            }`}
          >
            {!isCollapsed && (
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl bg-primary`}>
                  <Wallet className={`h-5 w-5 text-primary-foreground`} />
                </div>
                <h1 className="text-xl font-bold text-sidebar-foreground">
                  Cashly
                </h1>
              </div>
            )}
            <SidebarTrigger />
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
          <SidebarMenuItem>
            {(() => {
              const isActive = pathname === notificationItem.url;
              return (
                <SidebarMenuButton
                  asChild
                  tooltip={notificationItem.title}
                  size="lg"
                  isActive={isActive}
                >
                  <Link
                    href={notificationItem.url}
                    className="relative flex items-center gap-2"
                  >
                    <notificationItem.icon className="h-5 w-5" />
                    {!isCollapsed && (
                      <span className="text-base">
                        {notificationItem.title}
                      </span>
                    )}

                    {/* 未読件数バッジ */}
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                </SidebarMenuButton>
              );
            })()}
          </SidebarMenuItem>

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
