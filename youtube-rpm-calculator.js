const dollars = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const wholeNumber = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

const calculations = {
  rpm: ({ revenue, views }) => {
    const rpm = revenue / views * 1000;
    if (!Number.isFinite(rpm)) return 'Enter a smaller revenue amount.';
    if (rpm > 0 && rpm < 0.01) return 'Less than $0.01 per 1,000 views';
    return dollars.format(rpm) + ' per 1,000 views';
  },
  revenue: ({ views, rpm }) => {
    const revenue = views / 1000 * rpm;
    if (!Number.isFinite(revenue)) return 'Enter a smaller view count or RPM.';
    if (revenue > 0 && revenue < 0.01) return 'Less than $0.01 estimated revenue';
    return dollars.format(revenue) + ' estimated revenue';
  },
  views: ({ revenue, rpm }) => {
    if (revenue === 0) return '0 views needed';
    if (rpm === 0) return 'Enter an RPM above zero to reach a positive goal.';
    const views = Math.ceil(revenue / rpm * 1000);
    if (!Number.isSafeInteger(views)) return 'Enter a smaller goal or a higher RPM.';
    return wholeNumber.format(views) + ' views needed';
  }
};

for (const form of document.querySelectorAll('form[data-calculation]')) {
  const output = form.querySelector('output');
  form.addEventListener('input', () => {
    output.value = '';
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = Object.fromEntries(
      [...new FormData(form)].map(([name, value]) => [name, Number(value)])
    );
    output.value = calculations[form.dataset.calculation](values);
  });
}
