export const formatDate = (isoOrStr) => {
  if (!isoOrStr) return '';
  const d = new Date(isoOrStr);
  if (isNaN(d.getTime())) return isoOrStr;
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const to12Hour = (time24) => {
  if (!time24) return '';
  let [h, m] = String(time24).split(':');
  if (h === undefined) return time24;
  h = parseInt(h, 10);
  if (Number.isNaN(h)) return time24;
  const suffix = h >= 12 ? 'PM' : 'AM';
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;
  return `${hour12}:${String(m || '00').padStart(2, '0')} ${suffix}`;
};

export const to24Hour = (h12, suffix) => {
  if (!h12) return '';
  const [hPart, mPart] = String(h12).split(':');
  let h = parseInt(hPart, 10);
  if (Number.isNaN(h)) return '';
  const suf = (suffix || 'AM').toUpperCase();
  if (suf === 'PM' && h < 12) h += 12;
  if (suf === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${String(mPart || '00').padStart(2, '0')}`;
};

export const parseTimeParts = (time24) => {
  if (!time24) {
    const now = new Date();
    const h = now.getHours();
    return {
      hhmm: `${String(h > 12 ? h - 12 : h === 0 ? 12 : h).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      period: h >= 12 ? 'PM' : 'AM',
    };
  }
  const [hStr, m] = String(time24).split(':');
  let h = parseInt(hStr, 10);
  if (Number.isNaN(h)) return { hhmm: '12:00', period: 'PM' };
  const period = h >= 12 ? 'PM' : 'AM';
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return {
    hhmm: `${String(h12).padStart(2, '0')}:${String(m || '00').padStart(2, '0')}`,
    period,
  };
};

export const formatSchedule = ({ date, time, schedule }) => {
  const d = formatDate(date);
  const t = to12Hour(time);
  if (d && t) return `${d} at ${t}`;
  if (d) return d;
  if (t) return t;
  return schedule || 'Schedule TBD';
};
