let ledger_menu = document.getElementById("ledger_menu");
let ledger_list = document.getElementById("ledger_list");
let ledger_account = document.getElementById("ledger_account");
let ledger_item = (row) => {
	return `<li id="ledger_${row.id}" style="anchor-name: --ledger-${row.id}; position-anchor: --ledger-${row.id};">
		<a href="#ledger_account" onclick="fetch_ledger_account('${row.account}');">${row.account}</a>
		<button aria-controls="options_ledger_${row.id}" aria-expanded="false" aria-haspopup="dialog" aria-label="Options for ledger account ${row.account}" class="options_button" onclick="
			event.stopPropagation();
			showOptions('options_ledger_${row.id}');			
		" style="anchor-name: --btn-ledger_${row.id}; position-anchor: --btn-ledger_${row.id};"><span aria-hidden="true">&vellip;</span></button>
		<dialog class="options_wrapper" style="position-anchor: --btn-ledger_${row.id}; z-index: 1">
			<div class="options" id="options_ledger_${row.id}">
				<button aria-controls="details_ledger_${row.id}" aria-expanded="false" aria-haspopup="dialog" onclick="
					event.stopPropagation();
					hideOptions('options_ledger_${row.id}');
					showOptions('details_ledger_${row.id}');
				">Details</button>
				<button onclick="
					event.stopPropagation();
					hideOptions('options_ledger_${row.id}');
				">Close</button>
			</div>
		</dialog>
		<dialog class="options_wrapper" style="position-anchor: --btn-ledger_${row.id}; z-index: 1">
			<div class="options" id="details_ledger_${row.id}">
				<dl class="description">
					<dt>TB Side:</dt><dd class="side">${row.tb_side}</dd>
					<dt>BS Type:</dt><dd class="type">${row.bs_type}</dd>
					<dt>BS Subtype:</dt><dd class="subtype">${row.bs_subtype}</dd>
					<dt>BS Operation:</dt><dd class="operation">${row.bs_operation}</dd>
				</dl>
				<button onclick="
					event.stopPropagation();
					hideOptions('details_ledger_${row.id}');
					showOptions('options_ledger_${row.id}');
				">Back</button>
				<button onclick="
					event.stopPropagation();
					hideOptions('details_ledger_${row.id}');
				">Close</button>
			</div>
		</dialog>
	</li>`;
};
let fetch_ledger_menu = (ledger_q=null) => {
	ledger_list.innerHTML = "";
	fetch(`/ledger/${user_token}/${uid}/${fy_id}`, {method: "GET"})
	.then(response => response.json())
	.then(data => {
		if (data.error) {
			alert(data.error);
		} else {
			for (row of data) {
				ledger_list.insertAdjacentHTML("beforeend", ledger_item(row));
			}
			filter_list(document.getElementById("ledger_filter_form").querySelectorAll("input"),ledger_list);
		}
	})
	.catch(error => {alert(error);});
};
let fetch_ledger_account = (account) => {
	ledger_table.querySelector(".tbody").innerHTML = "";
	fetch(`/ledger/${user_token}/${uid}/${fy_id}?account=${account}`, {method: "GET"})
	.then(response => response.json())
	.then(data => {
		if (data.error) {
			if (data.error == "invalid account") {
				window.location.href = "#ledger_menu";
				ledger_account.querySelector(".account").textContent = "";
			} else {
				alert(data.error);
			}
		} else {
			ledger_account.querySelector(".account").textContent = account;
			if (!data.debit_side) {
				data.debit_side = [];
			}
			if (!data.credit_side) {
				data.credit_side = [];
			}
			let tbody = ledger_table.querySelector(".tbody");
			for (let i=0; i < Math.max(data.debit_side.length, data.credit_side.length); i++) {
				tbody.insertAdjacentHTML("beforeend", `<div aria-label="Ledger Account Row: ${i}" class="tr" role="row">
					<div class="td" role="cell">
						<small aria-live="assertive" class="error" id="ledger_dr_date_${i}_error">${data.debit_side[i] ? `Journal Reference: Journal Row ${data.debit_side[i].journal_entry_id}` : "Empty row"}</small>
						<input aria-describedby="ledger_dr_date_${i}_error" aria-labelledby="ledger_dr_date_head" autocomplete="off" id="ledger_dr_date_${i}" name="ledger_dr_date_${i}" onblur="this.previousElementSibling.classList.remove('on')" onfocus="this.previousElementSibling.classList.add('on')" readonly type="text" value="${data.debit_side[i] ? data.debit_side[i].journal_date : ""}">
					</div>
					<div class="td" role="cell">
						<small aria-live="assertive" class="error" id="ledger_dr_particulars_${i}_error">${data.debit_side[i] ? `Journal Reference: Journal Row ${data.debit_side[i].journal_entry_id}` : "Empty row"}</small>
						<input aria-describedby="ledger_dr_particulars_${i}_error" aria-labelledby="ledger_dr_particulars_head" autocomplete="off" id="ledger_dr_particulars_${i}" name="ledger_dr_particulars_${i}" onblur="this.previousElementSibling.classList.remove('on')" onfocus="this.previousElementSibling.classList.add('on')" readonly type="text" value="${data.debit_side[i] ? data.debit_side[i].account : ""}">
					</div>
					<div class="td" role="cell">
						<small aria-live="assertive" class="error" id="ledger_dr_amount_${i}_error">${data.debit_side[i] ? `Journal Reference: Journal Row ${data.debit_side[i].journal_entry_id}` : "Empty row"}</small>
						<input aria-describedby="ledger_dr_amount_${i}_error" aria-labelledby="ledger_dr_amount_head" autocomplete="off" id="ledger_dr_amount_${i}" name="ledger_dr_amount_${i}" onblur="this.previousElementSibling.classList.remove('on')" onfocus="this.previousElementSibling.classList.add('on')" readonly type="number" value="${data.debit_side[i] ? data.debit_side[i].journal_amount : ""}">
					</div>
					<div class="td" role="cell">
						<small aria-live="assertive" class="error" id="ledger_cr_date_${i}_error">${data.credit_side[i] ? `Journal Reference: Journal Row ${data.credit_side[i].journal_entry_id}` : "Empty row"}</small>
						<input aria-describedby="ledger_cr_date_${i}_error" aria-labelledby="ledger_cr_date_head" autocomplete="off" id="ledger_cr_date_${i}" name="ledger_cr_date_${i}" onblur="this.previousElementSibling.classList.remove('on')" onfocus="this.previousElementSibling.classList.add('on')" readonly type="text" value="${data.credit_side[i] ? data.credit_side[i].journal_date : ""}">
					</div>
					<div class="td" role="cell">
						<small aria-live="assertive" class="error" id="ledger_cr_particulars_${i}_error">${data.credit_side[i] ? `Journal Reference: Journal Row ${data.credit_side[i].journal_entry_id}` : "Empty row"}</small>
						<input aria-describedby="ledger_cr_particulars_${i}_error" aria-labelledby="ledger_cr_particulars_head" autocomplete="off" id="ledger_cr_particulars_${i}" name="ledger_cr_particulars_${i}" onblur="this.previousElementSibling.classList.remove('on')" onfocus="this.previousElementSibling.classList.add('on')" readonly type="text" value="${data.credit_side[i] ? data.credit_side[i].account : ""}">
					</div>
					<div class="td" role="cell">
						<small aria-live="assertive" class="error" id="ledger_cr_amount_${i}_error">${data.credit_side[i] ? `Journal Reference: Journal Row ${data.credit_side[i].journal_entry_id}` : "Empty row"}</small>
						<input aria-describedby="ledger_cr_amount_${i}_error" aria-labelledby="ledger_cr_amount_head" autocomplete="off" id="ledger_cr_amount_${i}" name="ledger_cr_amount_${i}" onblur="this.previousElementSibling.classList.remove('on')" onfocus="this.previousElementSibling.classList.add('on')" readonly type="number" value="${data.credit_side[i] ? data.credit_side[i].journal_amount : ""}">
					</div>
				</div>`);
			}
			if (data.balance_side) {
				let replacee = ("<div aria-label='Ledger Account Row: Empty Row' class='tr' role='row'>"+"<div class='td' role='cell'></div>".repeat(6)+"</div>").repeat(3);
				replacee += `${data.balance_side == "debit_side" ? "<div class='td' role='cell'>" : "</div>"}`;
				let balance_row = `
					<div class="td" role='cell'></div>
					<div class="td" role='cell'><span id="balance_cd">Balance c/d</span></div>
					<div class="td" role='cell'><input aria-labelledby="balance_cd" autocomplete="off" name="ledger_balance_cd" readonly type="number" value="${data.balance}"></div>
				`;
				tbody.innerHTML = tbody.innerHTML.replaceAll("\t", "").replaceAll("\r", "").replaceAll("\n", "");
				if (tbody.innerHTML.includes(replacee)) {
					balance_row += data.balance_side == "debit_side" ? "<div class='td' role='cell'>" : "</div>";
					tbody.innerHTML = tbody.innerHTML.replace(replacee, balance_row);
				} else {
					let empties = "<div class='td' role='cell'></div>".repeat(3);
					balance_row = data.balance_side == "debit_side" ? balance_row + empties : empties + balance_row;
					balance_row = `<div class="tr" role='row'>${balance_row}</div>`;
					tbody.insertAdjacentHTML("beforeend", balance_row);
				}
			}
			let empty_row = "<div class='tr' role='row'>"+"<div class='td' role='cell'></div>".repeat(6)+"</div>";
			tbody.insertAdjacentHTML("beforeend", empty_row+"<div class='tr' role='row'>"+`
				<div class="td" role="cell"></div>
				<div class="td" role="cell"></div>
				<div class="td" role="cell"><input aria-label="total" autocomplete="off" name="ledger_account_total" readonly type="number" value="${data.total}"></div>
			`.repeat(2)+"</div>");
		}
	})
	.catch(error => {alert(error);});
};
let export_ledger = async () => {
	window.location.href = `/ledger/${user_token}/${uid}/${fy_id}?account=${ledger_account.querySelector(".account").textContent}&download=True`;
};
let export_all_ledgers = async () => {
	window.location.href = `/ledger/${user_token}/${uid}/${fy_id}?download=True`;
};
let refer_ledger = (account) => {
	window.location.href = "#ledger_account";
	fetch_ledger_account(account);
};