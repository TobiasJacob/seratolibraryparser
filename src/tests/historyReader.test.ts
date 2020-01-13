import { getStringFromUInt32, getUInt32FromString } from '../historyReader'

test('stringToUint', () => {
    expect(getStringFromUInt32(getUInt32FromString('asdf')) === 'asdf');
})
test('UintToString', () => {
    expect(getUInt32FromString(getStringFromUInt32(23142)) === 23142);
})