"use client"

import ProfileHeader from "@/components/UI/Profile/ProfileHeader"
import ProfileTabBar from "@/components/UI/Profile/ProfileTabBar"
import ProfileTabContent from "@/components/UI/Profile/ProfileTabContent"

export default function ProfilePanel({ profile }) {
  const {
    profileUserId,
    isOwnProfile,
    activeTab,
    rightTab,
    setTab,
    tabLabels,
    visibleMobileTabs,
    visibleDesktopTabs,
    shouldLoadPinned,
    recipeList,
    isAuthenticated,
    loginHref,
  } = profile

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain bg-neutral-900/40">
      <div className="lg:pt-14">
        <ProfileHeader profileUserId={profileUserId} />

        <div className="lg:hidden">
          <ProfileTabBar
            tabs={visibleMobileTabs}
            activeTab={activeTab}
            onTabChange={setTab}
            labels={tabLabels}
          />
        </div>

        <div className="hidden lg:block">
          <ProfileTabBar
            tabs={visibleDesktopTabs}
            activeTab={rightTab}
            onTabChange={setTab}
            labels={tabLabels}
          />
        </div>
      </div>

      <ProfileTabContent
        activeTab={activeTab}
        rightTab={rightTab}
        profileUserId={profileUserId}
        isOwnProfile={isOwnProfile}
        shouldLoadPinned={shouldLoadPinned}
        recipeList={recipeList}
        isAuthenticated={isAuthenticated}
        loginHref={loginHref}
      />
    </div>
  )
}
