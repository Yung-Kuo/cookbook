import AddButton from "./AddButton";

function AddRecipeButton({ onClick }) {
  return (
    <AddButton
      onClick={onClick}
      parentClassName="fixed bottom-16 left-16 -translate-x-1/2 translate-y-1/2"
      className="h-16 w-16 bg-red-300 text-neutral-800 hover:bg-red-400"
    />
  );
}

export default AddRecipeButton;
