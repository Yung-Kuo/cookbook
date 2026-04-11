import CloseIcon from "../../Icons/CloseIcon";
export const CloseButton = ({ onClose }) => {
  return (
    <button
      className=" grid h-10 w-10 cursor-pointer grid-cols-1 grid-rows-1 rounded-full transition-all group"
      onMouseDown={onClose}
      title="Close"
    >
      <CloseIcon className="col-start-1 z-10 row-start-1 h-full w-full p-1 text-neutral-200" />
      <div className="col-start-1 row-start-1 h-full w-full rounded-full bg-neutral-600/40 backdrop-blur-xs group-hover:bg-red-200  transition-all" />
    </button>
  );
};
