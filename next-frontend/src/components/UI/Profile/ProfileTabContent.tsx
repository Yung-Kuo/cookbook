"use client"

import type { ReactNode } from "react"
import RecipeListPanel from "@/components/UI/RecipeList/RecipeListPanel"
import PinnedSection from "@/components/UI/Sections/PinnedSection"
import CollectionsSection from "@/components/UI/Sections/CollectionsSection"
import type { UseRecipeListReturn } from "@/hooks/useRecipeList"

type TabPaneVisibilityProps = {
  showMobile: boolean
  showDesktop: boolean
  children: ReactNode
}

function TabPaneVisibility({
  showMobile,
  showDesktop,
  children,
}: TabPaneVisibilityProps) {
  return (
    <div
      className={`min-h-0 ${showMobile ? "max-lg:block" : "max-lg:hidden"} ${showDesktop ? "lg:block" : "lg:hidden"}`}
    >
      {children}
    </div>
  )
}

type ProfileTabContentProps = {
  activeTab: string
  rightTab: string
  profileUserId: number | string
  isOwnProfile: boolean
  shouldLoadPinned: boolean
  recipeList: UseRecipeListReturn
  isAuthenticated: boolean
  loginHref: string
}

export default function ProfileTabContent({
  activeTab,
  rightTab,
  profileUserId,
  isOwnProfile,
  shouldLoadPinned,
  recipeList,
  isAuthenticated,
  loginHref,
}: ProfileTabContentProps) {
  return (
    <>
      <TabPaneVisibility
        showMobile={activeTab === "pinned"}
        showDesktop={rightTab === "pinned"}
      >
        <PinnedSection
          profileUserId={profileUserId}
          isOwner={isOwnProfile}
          isActive={shouldLoadPinned}
          onRecipeOpen={recipeList.selectRecipeForOverlay}
          className="px-4 pt-2 pb-24 lg:px-6"
        />
      </TabPaneVisibility>

      <TabPaneVisibility
        showMobile={activeTab === "collections"}
        showDesktop={rightTab === "collections"}
      >
        <CollectionsSection
          profileUserId={profileUserId}
          isOwner={isOwnProfile}
          isActive={activeTab === "collections"}
          className="px-4 pt-2 pb-24 lg:px-6"
        />
      </TabPaneVisibility>

      {activeTab === "recipes" && (
        <div className="flex min-h-0 flex-1 flex-col px-0 lg:hidden">
          <RecipeListPanel
            recipeList={recipeList}
            isAuthenticated={isAuthenticated}
            loginHref={loginHref}
            profileUserId={profileUserId}
            withModal={false}
          >
            {recipeList.recipeListItems}
          </RecipeListPanel>
        </div>
      )}
    </>
  )
}
