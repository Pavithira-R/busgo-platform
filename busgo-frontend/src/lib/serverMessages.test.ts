import i18n from '../i18n';
import { ApiError } from './api';
import { formatLkr } from './format';
import { translateServerMessage } from './serverMessages';

describe('server messages in the user language', () => {
  it('translates messages passengers can see', async () => {
    expect(
      translateServerMessage('Seat C3 is already booked for this trip'),
    ).toBe('Seat C3 is already booked for this trip.');
    await i18n.changeLanguage('si');
    expect(
      translateServerMessage('Seat C3 is already booked for this trip'),
    ).toBe('ආසනය C3 මෙම ගමන සඳහා දැනටමත් වෙන්කර ඇත.');
    await i18n.changeLanguage('ta');
    expect(translateServerMessage('Invalid email or password')).toBe(
      'மின்னஞ்சல் அல்லது கடவுச்சொல் தவறானது.',
    );
  });

  it('translates the booking status inside a message', async () => {
    await i18n.changeLanguage('si');
    expect(translateServerMessage('This booking is already cancelled')).toBe(
      'මෙම වෙන්කිරීම දැනටමත් අවලංගුයි.',
    );
  });

  it('leaves messages it does not know as the server wrote them', async () => {
    await i18n.changeLanguage('si');
    expect(translateServerMessage('Operator "X" already exists')).toBe(
      'Operator "X" already exists',
    );
  });

  it('hides server faults behind a friendly message', async () => {
    await i18n.changeLanguage('ta');
    expect(new ApiError(500, ['Internal server error']).message).toBe(
      'ஏதோ தவறு நடந்தது. மீண்டும் முயற்சிக்கவும்.',
    );
    expect(new ApiError(0, []).message).toBe(
      'BusGo உடன் இணைக்க முடியவில்லை. உங்கள் இணைப்பைச் சரிபார்க்கவும்.',
    );
  });

  it('writes the rupee sign the local way, with Western digits', async () => {
    expect(formatLkr(1050)).toBe('LKR 1,050');
    await i18n.changeLanguage('si');
    expect(formatLkr(1050)).toBe('රු. 1,050');
    await i18n.changeLanguage('ta');
    expect(formatLkr(1050)).toBe('ரூ. 1,050');
  });
});
