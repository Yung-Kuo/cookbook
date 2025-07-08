import { useState } from "react";
import NewRecipeForm from "../../Forms/NewRecipeForm";
import CloseIcon from "../../Icons/CloseIcon";

function NewRecipePopup({ show, onClose, onRecipeCreated }) {
  //   const [show, setShow] = useState([true]);
  return (
    <div
      className={`fixed top-0 left-0 z-30 flex h-screen w-screen items-center justify-center overflow-hidden ${show ? "flex" : "hidden"}`}
    >
      {/* mask */}
      <div
        onClick={onClose}
        className="fixed top-0 left-0 z-30 h-full w-full bg-neutral-600/60 backdrop-blur-xs"
      ></div>
      {/* Recipe Form */}
      <div className="z-40 h-full w-full bg-neutral-800 lg:h-5/6 lg:max-h-[88rem] lg:w-4/5 lg:max-w-[72rem]">
        {/* Close Button */}
        <div className="relative">
          <button
            className="absolute top-5 right-5 z-50 grid h-10 w-10 grid-cols-1 grid-rows-1 rounded-full backdrop-blur-xs"
            onMouseDown={onClose}
          >
            <div className="col-start-1 row-start-1 h-full w-full rounded-full bg-neutral-200 opacity-10" />
            <CloseIcon className="col-start-1 row-start-1 h-full w-full p-1 text-neutral-200" />
          </button>
        </div>

        {/* Form */}
        <NewRecipeForm onClose={onClose} onRecipeCreated={onRecipeCreated} />
      </div>
    </div>
  );
}

export default NewRecipePopup;
