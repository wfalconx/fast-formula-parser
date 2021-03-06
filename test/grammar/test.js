const chai = require('chai');
const expect = require('chai').expect;
const FormulaError = require('../../formulas/error');
const {FormulaParser} = require('../../grammar/hooks');
const {DepParser} = require('../../grammar/dependency/hooks');

const parser = new FormulaParser({
        onCell: ref => {
            return 1;
        },
        onRange: ref => {
            return [[1, 2, 3], [0, 0, 0]]
        },
    }
);
const depParser = new DepParser({
    onVariable: variable => {
        return 'aaaa' === variable ? {from: {row: 1, col: 1}, to: {row: 2, col: 2}} : {row: 1, col: 1};
    }
});
const position = {row: 1, col: 1, sheet: 'Sheet1'};

describe('Dependency parser', () => {
    it('should parse single cell', () => {
        let actual = depParser.parse('A1', position);
        expect(actual).to.deep.eq([Object.assign({address: 'A1'}, position)]);
        actual = depParser.parse('A1+1', position);
        expect(actual).to.deep.eq([Object.assign({address: 'A1'}, position)]);
    });

    it('should parse ranges', () => {
        let actual = depParser.parse('A1:C3', position);
        expect(actual).to.deep.eq([{sheet: 'Sheet1', from: {row: 1, col: 1}, to: {row: 3, col: 3}}]);
        actual = depParser.parse('A:C', position);
        expect(actual).to.deep.eq([{sheet: 'Sheet1', from: {row: 1, col: 1}, to: {row: 1048576, col: 3}}]);
        actual = depParser.parse('1:3', position);
        expect(actual).to.deep.eq([{sheet: 'Sheet1', from: {row: 1, col: 1}, to: {row: 3, col: 16384}}]);
    });

    it('should parse variable', function () {
        let actual = depParser.parse('aaaa', position);
        expect(actual).to.deep.eq([{sheet: 'Sheet1', from: {row: 1, col: 1}, to: {row: 2, col: 2}}]);
    });

    it('should parse complex formula', () => {
        let actual = depParser.parse('IF(MONTH($K$1)<>MONTH($K$1-(WEEKDAY($K$1,1)-(start_day-1))-IF((WEEKDAY($K$1,1)-(start_day-1))<=0,7,0)+(ROW(O5)-ROW($K$3))*7+(COLUMN(O5)-COLUMN($K$3)+1)),"",$K$1-(WEEKDAY($K$1,1)-(start_day-1))-IF((WEEKDAY($K$1,1)-(start_day-1))<=0,7,0)+(ROW(O5)-ROW($K$3))*7+(COLUMN(O5)-COLUMN($K$3)+1))', position);
        expect(actual).to.deep.eq([
            {
                "address": "$K$1",
                "col": 11,
                "row": 1,
                "sheet": "Sheet1",
            },
            {
                "col": 1,
                "row": 1,
                "sheet": "Sheet1",
            },
            {
                "address": "O5",
                "col": 15,
                "row": 5,
                "sheet": "Sheet1",
            },
            {
                "address": "$K$3",
                "col": 11,
                "row": 3,
                "sheet": "Sheet1",
            },
        ]);
    });

});

describe('Parser allows returning array or range', () => {
    it('should parse array', function () {
        let actual = parser.parse('{1,2,3}', position, true);
        expect(actual).to.deep.eq([[1, 2, 3]]);
        actual = parser.parse('{1,2,3;4,5,6}', position, true);
        expect(actual).to.deep.eq([[1, 2, 3], [4, 5, 6]]);
    });

    it('should parse range', function () {
        let actual = parser.parse('A1:C1', position, true);
        expect(actual).to.deep.eq([[1, 2, 3], [0, 0, 0]]);
    });

    it('should not parse unions', function () {
        let actual = parser.parse('(A1:C1, A2:E9)', position, true);
        expect(actual).to.eq(FormulaError.VALUE);
    });

});
