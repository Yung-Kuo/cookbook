import CloseIcon from "../../Icons/CloseIcon";
export const CloseButton = ({ onClose }) => {
  return (
    <button
      className="absolute top-5 right-5 z-50 grid h-10 w-10 cursor-pointer grid-cols-1 grid-rows-1 rounded-full backdrop-blur-xs transition-all hover:scale-110"
      onMouseDown={onClose}
    >
      <div className="col-start-1 row-start-1 h-full w-full rounded-full bg-neutral-200 opacity-10" />
      <CloseIcon className="col-start-1 row-start-1 h-full w-full p-1 text-neutral-200" />
    </button>
  );
};
