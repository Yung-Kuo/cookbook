import DeleteIcon from "../../Icons/DeleteIcon";

function DeleteButton({
  className = "h-6 w-6 bg-neutral-500 text-neutral-800 hover:bg-neutral-400",
  onClick,
}) {
  return (
    <div onClick={onClick} className="rounded-full">
      <button
        type="button"
        className={`z-10 flex cursor-pointer appearance-none items-center justify-center rounded-full transition-all focus:outline-none active:scale-90 ${className}`}
        aria-label="Add new recipe"
        title="Click to add a new recipe"
      >
        <DeleteIcon className="h-full w-full rounded-full" />
      </button>
    </div>
  );
}

export default DeleteButton;
