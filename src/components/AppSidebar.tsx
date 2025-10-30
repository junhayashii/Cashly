"use client";

import { useState, useEffect } from "react";
import { Settings, Menu, Bell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
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

  type IconType = typeof settingsItem.icon;

  const renderNavIcon = (
    IconComponent: IconType,
    {
      iconClassName,
      showUnreadBadge = false,
    }: {
      iconClassName?: string;
      showUnreadBadge?: boolean;
    } = {}
  ) => (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center",
        isCollapsed ? "h-6 w-6 overflow-visible" : "h-6 w-6"
      )}
    >
      <IconComponent
        className={cn(
          "relative z-[1] h-5 w-5 transition-colors",
          iconClassName
        )}
      />
      {showUnreadBadge && showUnread && (
        <span
          aria-hidden="true"
          className="absolute -top-0.5 -right-0.5 flex h-3 w-3 items-center justify-center"
        >
          <span className="absolute h-full w-full rounded-full bg-destructive/40 blur-sm" />
          <span className="relative h-2 w-2 rounded-full bg-destructive" />
        </span>
      )}
    </span>
  );

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
                <Image
                  src="/logo.png"
                  alt="Cashly logo"
                  width={40}
                  height={40}
                  className="h-10 w-10"
                />
                <h1 className="text-xl font-bold text-primary">Cashly</h1>
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
                          <Link
                            href={item.url}
                            className={cn(
                              "group flex w-full items-center gap-2",
                              isCollapsed && "justify-center gap-0"
                            )}
                          >
                            {renderNavIcon(item.icon)}
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
                        <Link
                          href={settingsItem.url}
                          className={cn(
                            "group flex w-full items-center gap-2",
                            isCollapsed && "justify-center gap-0"
                          )}
                        >
                          {renderNavIcon(settingsItem.icon)}
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
        <SidebarHeader className="border-sidebar-border py-4 min-h-[88px]">
          <div
            className={cn(
              "relative flex h-full items-center transition-all duration-200",
              isCollapsed ? "justify-center px-0" : "px-4"
            )}
          >
            <div
              className={cn(
                "group/logo relative flex items-center transition-all duration-200",
                isCollapsed ? "justify-center" : "flex-1 justify-start"
              )}
            >
              <span
                className={cn(
                  "relative flex size-12 items-center justify-center rounded-md transition-all duration-200",
                  isCollapsed ? undefined : ""
                )}
              >
                <Image
                  src="/logo.png"
                  alt="Cashly logo"
                  width={48}
                  height={48}
                  className={cn(
                    "size-12 transition-all duration-200",
                    isCollapsed && "group-hover/logo:opacity-0"
                  )}
                />
              </span>
              <h1
                aria-hidden={isCollapsed}
                className={cn(
                  "text-xl font-bold text-sidebar-foreground transition-all duration-200",
                  isCollapsed
                    ? "ml-0 w-0 overflow-hidden opacity-0"
                    : "ml-3 w-auto opacity-100"
                )}
              >
                Cashly
              </h1>
              <SidebarTrigger
                className={cn(
                  "rounded-md transition-all duration-200",
                  isCollapsed
                    ? "absolute inset-0 m-auto flex size-12 items-center justify-center opacity-0 pointer-events-none group-hover/logo:bg-sidebar-accent group-hover/logo:text-sidebar-accent-foreground group-hover/logo:opacity-100 group-hover/logo:pointer-events-auto focus-visible:opacity-100 focus-visible:pointer-events-auto"
                    : "ml-auto"
                )}
              />
            </div>
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
                      <Link
                        href={item.url}
                        className={cn(
                          "group flex w-full items-center gap-2",
                          isCollapsed && "justify-center gap-0"
                        )}
                      >
                        {renderNavIcon(item.icon)}
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
                    className={cn(
                      "group flex w-full items-center gap-2",
                      isCollapsed && "justify-center gap-0"
                    )}
                  >
                    {renderNavIcon(notificationItem.icon, {
                      iconClassName:
                        showUnread && !isActive ? "text-primary" : undefined,
                      showUnreadBadge: true,
                    })}
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
                    <Link
                      href={settingsItem.url}
                      className={cn(
                        "group flex w-full items-center gap-2",
                        isCollapsed && "justify-center gap-0"
                      )}
                    >
                      {renderNavIcon(settingsItem.icon)}
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
