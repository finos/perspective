const jsonFormatter = {
    initDataValue: () => [],
    initRowValue: () => ({}),
    initColumnValue: (row, colName) => row[colName] = {},
    setColumnValue: (row, colName, value) => row[colName] = [value],
    addColumnValue: (row, colName, value) => row[colName].unshift(value),
    addRow: (data, row) => data.push(row)
    formatData: (data) => data
};

const csvFormatter = {
    initDataValue: () => [''],
    initRowValue: () => ({}),
    initColumnValue: (row, colName) => void,
    setColumnValue: (data, row, colName, value) => {
        row.push(value);
        //append header
        data[0] = data[0] + "," + value;
    },
    addColumnValue: (data, row, colName, value) => {
        row.unshift(value);
        //prepend header
        data[0] = value + "," + data[0];
    },
    addRow: (data, row) => data.push(row.toString()),
    formatData: (data) => data.join('\r\n')
};

export default {
    jsonFormatter,
    csvFormatter
};
