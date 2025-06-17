import AddIcon from "../../Icons/AddIcon";

function AddButton({
  parentClassName,
  className = "bg-red-300 hover:bg-red-400 text-neutral-900",
  onClick,
}) {
  return (
    <div onClick={onClick} className={`rounded-full ${parentClassName}`}>
      <button
        type="button"
        className={`z-10 flex cursor-pointer appearance-none items-center justify-center rounded-full transition-all focus:outline-none active:scale-90 ${className}`}
        aria-label="Add new recipe"
        title="Click to add a new recipe"
      >
        <AddIcon className="box-border h-full w-full rounded-full" />
      </button>
    </div>
  );
}

export default AddButton;
