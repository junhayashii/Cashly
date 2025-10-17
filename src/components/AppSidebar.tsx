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
import { Badge } from "@/components/ui/badge";

import { mainMenuItems } from "@/constants";
import { useUnreadNotifications } from "@/hooks/useNotifications";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";

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
  const { unreadCount } = useUnreadNotifications(userId);
  const showUnread = unreadCount > 0;
  const displayUnread = unreadCount > 99 ? "99+" : String(unreadCount);

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
                    className="flex w-full items-center gap-2"
                  >
                    <span className="relative flex items-center">
                      <notificationItem.icon
                        className={cn(
                          "h-5 w-5 transition-colors",
                          showUnread && !isActive
                            ? "text-primary"
                            : undefined
                        )}
                      />
                      {showUnread && (
                        <span
                          aria-hidden="true"
                          className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center"
                        >
                          <span className="absolute h-full w-full rounded-full bg-destructive/40 blur-sm" />
                          <span className="relative h-2 w-2 rounded-full bg-destructive" />
                        </span>
                      )}
                    </span>
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 text-base">
                          {notificationItem.title}
                        </span>
                        {showUnread && (
                          <Badge
                            variant="outline"
                            className="ml-auto shrink-0 border-destructive/30 bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive"
                          >
                            {displayUnread}
                          </Badge>
                        )}
                      </>
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
