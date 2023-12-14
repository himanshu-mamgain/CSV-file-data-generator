export default function addFormula(payload: object | any, rowNum: number): object {

    payload.formula = `this + ${rowNum}`;

    return payload;
}