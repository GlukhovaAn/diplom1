interface TableWrapperProps {
  children: any;
  isEmpty: boolean;
  emptyError: string;
  loading: boolean;
  headArr: string[];
}

export const TableWrapper = ({
  children,
  isEmpty,
  emptyError,
  loading,
  headArr,
}: TableWrapperProps) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            {headArr.map((el) => {
              return (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {el}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {loading ? (
            <tr>
              <td colSpan={7} className="text-center py-8 text-gray-500">
                Загрузка...
              </td>
            </tr>
          ) : isEmpty ? (
            <tr>
              <td colSpan={7} className="text-center py-8 text-gray-500">
                {emptyError}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
};
