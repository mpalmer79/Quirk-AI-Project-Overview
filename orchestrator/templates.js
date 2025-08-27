export const templates = {
  "new_internet_lead": {
    email: `Hi [[name]], thanks for your interest in the [[model_trim]]. 
We currently have [[stock_count]] in stock. [[incentive_line]]
Would Thursday at [[slot1]] or Saturday at [[slot2]] work best for a quick drive?
— [[agent]], [[store]]  
[[primary_photo]]  
(Stock [[stock_number]], VIN [[vin]])`,

    sms: `Hi [[name]], it’s [[agent]] at [[store]]. We have [[model_trim]] available now (stock [[stock_number]]). 
Thursday [[slot1]] or Saturday [[slot2]]?`
  },

  "best_price": {
    email: `Great question, [[name]]! The [[model_trim]] is currently priced at $[[price]] (MSRP $[[msrp]]). [[incentive_line]]
I can reserve one for you — Thursday [[slot1]] or Saturday [[slot2]]?  
— [[agent]]`,
    sms: `[[name]], [[model_trim]] is $[[price]] (MSRP $[[msrp]]). Hold one for you Thu [[slot1]] or Sat [[slot2]]?`
  }
};
