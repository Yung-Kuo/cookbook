import { useState } from "react";
import NewRecipeForm from "../../Forms/NewRecipeForm";

function NewRecipePopup({ show, onClose }) {
  //   const [show, setShow] = useState([true]);
  return (
    <div
      className={`fixed top-0 left-0 z-30 flex h-screen w-screen items-center justify-center overflow-hidden ${show ? "flex" : "hidden"}`}
    >
      <div
        onClick={onClose}
        className="fixed top-0 left-0 z-30 h-full w-full bg-neutral-600/60 backdrop-blur-xs"
      ></div>
      <div className="z-40 h-5/6 max-h-[88rem] w-4/5 max-w-[72rem] bg-neutral-800">
        <NewRecipeForm />
      </div>
    </div>
  );
}

export default NewRecipePopup;
