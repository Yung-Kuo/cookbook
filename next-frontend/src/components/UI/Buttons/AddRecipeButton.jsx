import AddButton from "./AddButton";

function AddRecipeButton({ onClick }) {
  return (
    <AddButton
      onClick={onClick}
      parentClassName="fixed h-12 w-12 z-20 lg:h-16 lg:w-16 bottom-26 left-12 lg:bottom-16 lg:left-16 -translate-x-1/2 translate-y-1/2"
      className="h-12 w-12 bg-red-300 text-neutral-800 hover:bg-red-400 lg:h-16 lg:w-16"
      title="Click to add a new recipe"
    />
  );
}

export default AddRecipeButton;
