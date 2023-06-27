import { PencilIcon } from "@heroicons/react/20/solid";
import { Edit3Icon, HistoryIcon } from "lucide-react";

type People = {
  name: string;
  breed: string;
  sex: string;
  color: string;
};

const people = new Array(50).fill({
  name: "Sadie Dog",
  breed: "Labrador Retriever",
  sex: "Female (Spayed)",
  color: "Yellow",
}) as People[];

export function ClientTable() {
  return (
    <div className="mt-8 flow-root">
      <div className="-mx-4 -my-2 [contain:paint] sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <div className="shadow ring-1 ring-black/5 [contain:paint] sm:rounded-lg">
            <table className="min-w-[50vw] divide-y divide-gray-300 overflow-x-scroll shadow">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="sticky top-0 z-10 rounded-tl-md border-b border-gray-300 bg-white/75 py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 backdrop-blur sm:pl-6 lg:pl-8"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    className="sticky top-0 z-10 hidden border-b border-gray-300 bg-white/75 px-8 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur sm:table-cell"
                  >
                    Breed
                  </th>
                  <th
                    scope="col"
                    className="sticky top-0 z-10 hidden border-b border-gray-300 bg-white/75 px-8 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur lg:table-cell"
                  >
                    Sex
                  </th>
                  <th
                    scope="col"
                    className="sticky top-0 z-10 border-b border-gray-300 bg-white/75 px-8 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur"
                  >
                    Color
                  </th>
                  <th
                    scope="col"
                    className="sticky top-0 z-10 rounded-tr-md border-b border-gray-300 bg-white/75  py-3.5 pl-8 pr-4 backdrop-blur sm:pr-6 lg:pr-8"
                  >
                    <span className="sr-only">Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white ">
                {people.map((person) => (
                  <tr key={person.name} className="">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      {person.name}
                    </td>
                    <td className="whitespace-nowrap px-8 py-4 text-sm text-gray-500">{person.breed}</td>
                    <td className="whitespace-nowrap px-8 py-4 text-sm text-gray-500">{person.sex}</td>
                    <td className="whitespace-nowrap px-8 py-4 text-sm text-gray-500">{person.color}</td>
                    <td className="flex justify-end space-x-3.5 whitespace-nowrap py-5 pl-8 pr-4 text-right text-sm font-medium sm:pr-6">
                      <HistoryIcon className="h-5 w-5" />
                      <Edit3Icon className="h-5 w-5" />
                      {/* <a href="#" className="text-indigo-600 hover:text-indigo-900">
                        Edit<span className="sr-only">, {person.name}</span>
                      </a> */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
