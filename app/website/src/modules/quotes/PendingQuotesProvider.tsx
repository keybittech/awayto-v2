import { useMemo, useState } from 'react';

import { plural, shortNSweet, IBooking } from 'awayto/core';
import { sh, useContexts, useUtil } from 'awayto/hooks';

export function PendingQuotesProvider ({ children }: IProps): React.JSX.Element {

  const { PendingQuotesContext } = useContexts();

  const { setSnack, openConfirm } = useUtil();
  const [disableQuote] = sh.useDisableQuoteMutation();
  const [postBooking] = sh.usePostBookingMutation();

  const [pendingQuotesChanged, setPendingQuotesChanged] = useState(false);
  const [selectedPendingQuotes, setSelectedPendingQuotes] = useState<string[]>([]);

  const { data : profile, refetch: getUserProfileDetails } = sh.useGetUserProfileDetailsQuery();

  const pendingQuotes = useMemo(() => Object.values(profile?.quotes || {}), [profile]);

  const pendingQuotesContext = {
    pendingQuotes,
    pendingQuotesChanged,
    selectedPendingQuotes,
    setSelectedPendingQuotes,
    handleSelectPendingQuote(quote) {
      const currentIndex = selectedPendingQuotes.indexOf(quote);
      const newChecked = [...selectedPendingQuotes];

      if (currentIndex === -1) {
        newChecked.push(quote);
      } else {
        newChecked.splice(currentIndex, 1);
      }

      setSelectedPendingQuotes(newChecked);
    },
    handleSelectPendingQuoteAll() {
      const pendingQuotesSet = selectedPendingQuotes.length === pendingQuotes.length ?
        selectedPendingQuotes.filter(v => !pendingQuotes.map(pq => pq.id).includes(v)) :
        [...selectedPendingQuotes, ...pendingQuotes.filter(v => !selectedPendingQuotes.includes(v.id)).map(pq => pq.id)];
      
      setSelectedPendingQuotes(pendingQuotesSet);
    },
    approvePendingQuotes() {
      const selectedValues = pendingQuotes.filter(pq => selectedPendingQuotes.includes(pq.id));
      if (!selectedValues.every(s => s.slotDate === selectedValues[0].slotDate && s.scheduleBracketSlotId === selectedValues[0].scheduleBracketSlotId)) {
        setSnack({ snackType: 'error', snackOn: 'Only appointments of the same date and time can be mass approved.' });
        return;
      }

      const { slotDate, startTime, scheduleBracketSlotId } = selectedValues[0];

      const copies = pendingQuotes.filter(q => !selectedValues.some(s => s.id === q.id)).filter(q => q.slotDate === slotDate && q.scheduleBracketSlotId === scheduleBracketSlotId);

      openConfirm({
        isConfirming: true,
        confirmEffect: `Approve ${plural(selectedValues.length, 'request', 'requests')}, creating ${plural(selectedValues.length, 'booking', 'bookings')}, for ${shortNSweet(slotDate, startTime)}.`,
        confirmSideEffect: !copies.length ? undefined : {
          approvalAction: 'Auto-Deny Remaining',
          approvalEffect: `Automatically deny all other requests for ${shortNSweet(slotDate, startTime)} (this cannot be undone).`,
          rejectionAction: 'Confirm Quote/Booking Only',
          rejectionEffect: 'Just submit the approvals.',
        },
        confirmAction: approval => {
          const newBookings = selectedValues.map(s => ({
            quoteId: s.id,
            slotDate: s.slotDate,
            scheduleBracketSlotId: s.scheduleBracketSlotId
          }) as IBooking);

          postBooking({ bookings: newBookings }).unwrap().then(() => {
            const disableQuoteIds = selectedValues.concat(approval ? copies : []).map(s => s.id).join(',');
            
            disableQuote({ ids: disableQuoteIds }).unwrap().then(() => {
              setSelectedPendingQuotes([]);
              setPendingQuotesChanged(!pendingQuotesChanged);
              void getUserProfileDetails();
            }).catch(console.error);
          }).catch(console.error);
        }
      });
    },
    denyPendingQuotes() {
      disableQuote({ ids: selectedPendingQuotes.join(',') }).unwrap().then(() => {
        setSelectedPendingQuotes([]);
        setPendingQuotesChanged(!pendingQuotesChanged);
        void getUserProfileDetails();
      }).catch(console.error);
    }
  } as PendingQuotesContextType | null;

  return useMemo(() => !PendingQuotesContext ? <></> : 
    <PendingQuotesContext.Provider value={pendingQuotesContext}>
      {children}
    </PendingQuotesContext.Provider>,
    [PendingQuotesContext, pendingQuotesContext]
  );
}

export default PendingQuotesProvider;