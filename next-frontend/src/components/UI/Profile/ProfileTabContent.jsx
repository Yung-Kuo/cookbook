"use client";

import RecipeListPanel from "@/components/UI/RecipeList/RecipeListPanel";
import PinnedSection from "@/components/UI/Sections/PinnedSection";
import CollectionsSection from "@/components/UI/Sections/CollectionsSection";

function TabPaneVisibility({ showMobile, showDesktop, children }) {
  return (
    <div
      className={`min-h-0 ${showMobile ? "max-lg:block" : "max-lg:hidden"} ${showDesktop ? "lg:block" : "lg:hidden"}`}
    >
      {children}
    </div>
  );
}

/**
 * @param {object} props
 * @param {string} props.activeTab
 * @param {string} props.rightTab
 * @param {number} props.profileUserId
 * @param {boolean} props.isOwnProfile
 * @param {boolean} props.shouldLoadPinned
 * @param {number} props.pinnedRefreshKey
 * @param {object} props.recipeList
 * @param {boolean} props.isAuthenticated
 * @param {string} props.loginHref
 */
export default function ProfileTabContent({
  activeTab,
  rightTab,
  profileUserId,
  isOwnProfile,
  shouldLoadPinned,
  pinnedRefreshKey,
  recipeList,
  isAuthenticated,
  loginHref,
}) {
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
          refreshKey={pinnedRefreshKey}
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
  );
}
