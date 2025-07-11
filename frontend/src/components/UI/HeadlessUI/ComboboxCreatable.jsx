import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  ComboboxButton,
} from "@headlessui/react";
import { useState } from "react";

function ComboboxCreate({
  name,
  className,
  options,
  value,
  onChange,
  noCreate = false,
}) {
  // const [selectedOption, setSelectedOption] = useState("");
  const [query, setQuery] = useState("");

  const filteredOptions =
    query === ""
      ? options
      : options.filter((option) => {
          return option.name.toLowerCase().includes(query.trim().toLowerCase());
        });

  return (
    <Combobox value={value} onChange={onChange} onClose={() => setQuery("")}>
      <div className="grid grid-cols-1 grid-rows-1">
        <ComboboxButton className="group z-20 col-start-1 row-start-1"></ComboboxButton>
        <ComboboxInput
          aria-label="Assignee"
          displayValue={(option) => option?.name}
          onChange={(event) => setQuery(event.target.value)}
          className={`z-10 col-start-1 row-start-1 ${className}`}
          placeholder={`Select a ${name}`}
        />
      </div>

      <div className="relative w-full">
        <ComboboxOptions className="absolute z-20 mt-2 max-h-72 w-full overflow-hidden overflow-y-auto rounded-md border-2 border-sky-600 bg-neutral-900 empty:invisible">
          {!noCreate &&
            query.length > 0 &&
            !filteredOptions.some(
              (option) =>
                option.name.toLowerCase() === query.trim().toLowerCase(),
            ) && (
              <ComboboxOption
                value={{ id: null, name: query }}
                className="cursor-pointer px-2 data-focus:bg-neutral-200 data-focus:text-neutral-800"
              >
                Create <span className="font-bold break-words">"{query}"</span>
              </ComboboxOption>
            )}
          {filteredOptions.map((option) => (
            <ComboboxOption
              key={option.id}
              value={option}
              className="cursor-pointer px-2 data-focus:bg-neutral-200 data-focus:text-neutral-800"
            >
              {option.name}
            </ComboboxOption>
          ))}
        </ComboboxOptions>
      </div>
    </Combobox>
  );
}

export default ComboboxCreate;
