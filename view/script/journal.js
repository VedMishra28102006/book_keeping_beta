let journal = document.getElementById("journal");
let journal_form = document.getElementById("journal_form");
let status = null;
let journal_row = (row) => {
	return `<div aria-label="Journal Row: ${(row) ? row.journal_entry_id : journal_rows.children.length}" class="tr" id="${(row) ? `entry_${uid}_${fy_id}_${row.id}` : ''}" role="row">
		<div class="td" role="cell">
			<small aria-live="assertive" class="error" id="journal_date_${(row) ? row.journal_entry_id : journal_rows.children.length}_error"></small>
			<input aria-describedby="journal_date_${(row) ? row.journal_entry_id : journal_rows.children.length}_error" aria-labelledby="journal_date_head" autocomplete="off" id="journal_date_${(row) ? row.journal_entry_id : journal_rows.children.length}" name="journal_date" onfocus="focused=this.parentNode" ${(status == "locked" || user_status == "locked" || (audition && uid != audition)) ? "readonly" : ""} type="date" value="${(row) ? row.journal_date : ''}">
		</div>
		<div class="td" role="cell">
			<small aria-live="assertive" class="error" id="journal_ac_debited_${(row) ? row.journal_entry_id : journal_rows.children.length}_error"></small>
			<input aria-describedby="journal_ac_debited_${(row) ? row.journal_entry_id : journal_rows.children.length}_error" aria-labelledby="journal_ac_debited_head" autocomplete="off" id="journal_ac_debited_${(row) ? row.journal_entry_id : journal_rows.children.length}" name="journal_ac_debited" onfocus="focused=this.parentNode" onkeydown="return event.key !== ','" ${(status == "locked" || user_status == "locked" || (audition && uid != audition)) ? "readonly" : ""} type="text" value="${(row) ? row.journal_ac_debited : ''}">
		</div>
		<div class="td" role="cell">
			<small aria-live="assertive" class="error" id="journal_ac_credited_${(row) ? row.journal_entry_id : journal_rows.children.length}_error"></small>
			<input aria-describedby="journal_ac_credited_${(row) ? row.journal_entry_id : journal_rows.children.length}_error" aria-labelledby="journal_ac_credited_head" autocomplete="off" id="journal_ac_credited_${(row) ? row.journal_entry_id : journal_rows.children.length}" name="journal_ac_credited" onfocus="focused=this.parentNode" onkeydown="return event.key !== ','" ${(status == "locked" || user_status == "locked" || (audition && uid != audition)) ? "readonly" : ""} type="text" value="${(row) ? row.journal_ac_credited : ''}">
		</div>
		<div class="td" role="cell">
			<small aria-live="assertive" class="error" id="journal_amount_${(row) ? row.journal_entry_id : journal_rows.children.length}_error"></small>
			<input aria-describedby="journal_amount_${(row) ? row.journal_entry_id : journal_rows.children.length}_error" aria-labelledby="journal_amount_head" autocomplete="off" id="journal_amount_${(row) ? row.journal_entry_id : journal_rows.children.length}" name="journal_amount" onfocus="focused=this.parentNode" oninput="update_total()" ${(status == "locked" || user_status == "locked" || (audition && uid != audition)) ? "readonly" : ""} oninput="update_total()" type="number" value="${(row) ? row.journal_amount : ''}">
		</div>
		<div class="td" role="cell">
			<small aria-live="assertive" class="error" id="journal_description_${(row) ? row.journal_entry_id : journal_rows.children.length}_error"></small>
			<input aria-describedby="journal_description_${(row) ? row.journal_entry_id : journal_rows.children.length}_error" aria-labelledby="journal_description_head" autocomplete="off" id="journal_description_${(row) ? row.journal_entry_id : journal_rows.children.length}" name="journal_description" onfocus="focused=this.parentNode" onkeydown="return !['(', ',', ')'].includes(event.key)" ${(status == "locked" || user_status == "locked" || (audition && uid != audition)) ? "readonly" : ""} type="text" value="${(row) ? row.journal_description : ''}">
		</div>
	</div>`;
};
let journal_rows = document.getElementById("journal_rows");
let journal_total = document.getElementById("journal_total");
let add_row = () => {
	if (user_status == "locked" || (audition && uid != audition)) {
		return;
	}
	if (focused) {
		focused.parentNode.insertAdjacentHTML("afterend", journal_row());
		focused = focused.parentNode.nextElementSibling.children[0];
	} else {
		journal_rows.insertAdjacentHTML("beforeend", journal_row());
		focused = journal_rows.children[journal_rows.children.length-1].children[0];
	}
	refresh_rows();
	let rowlabel = focused.parentNode.getAttribute("aria-label");
	document.getElementById("journal_action_msg").textContent = `New ${rowlabel} has been added`;
	focused.parentNode.scrollIntoView({
		behavior: "smooth",
		block: "center"
	});
	focused.children[1].focus();
	
};
let refresh_rows = () => {
		for (let i=0; i < journal_rows.children.length; i++) {
			journal_rows.children[i].setAttribute("aria-label", `Journal Row: ${i}`);
		}
};
let delete_row = () => {
	if (focused) {
		if (status != "locked" && user_status != "locked" && !audition) {
			let rowlabel = focused.parentNode.getAttribute("aria-label");
			let nextfocused = focused.parentNode.nextElementSibling;
			if (!nextfocused) nextfocused = focused.parentNode.previousElementSibling;
			focused.parentNode.remove();
			update_total();
			document.getElementById("journal_action_msg").textContent = `Old ${rowlabel} has been deleted`;
			if (nextfocused) focused = nextfocused.children[0];
			
		}
		focused = null;
		refresh_rows();
		if (focused) {
			focused.children[1].focus();
		}
	}
};
let fetch_journal = (id) => {
	journal_rows.innerHTML = "";
	fetch(`/journal/${user_token}/${uid}/${id}`, {method: "GET"})
	.then(response => response.json())
	.then(data => {
		if (data.error) {
			alert(data.error);
		} else {
			status = document.getElementById(`fy_${id}`).querySelector(".status").textContent;
			for (row of data.rows) {
				journal_rows.insertAdjacentHTML("beforeend", journal_row(row));
			}
			journal_total.innerHTML = `<div aria-label="Row: Total" class="tr" role="row">
				<div class="td" role="cell"><span></span></div>
				<div class="td" id="journal_total_head" role="cell" style="grid-column: span 2"><span>Total</span></div>
				<div class="td" role="cell"><input aria-labelledby="journal_total_head" id="total_amount" readonly type="number" value="${data.total}" /></div>
				<div class="td" role="cell"><span></span></div>
			</div>`;
			fetch_ledger_menu();
			ledger_account.querySelector(".account").textContent = "";
			fetch_bs();
			fetch_tb();
		}
	})
	.catch(error => {
		alert(error);
	});
};
let submit_journal = () => { return new Promise((resolve, reject) => {
	if (status == "locked" || user_status == "locked" || (audition && uid != audition)) { return resolve(false); }
	let dates = journal_form.querySelectorAll("input[name='journal_date']");
	let acs_debited = journal_form.querySelectorAll("input[name='journal_ac_debited']");
	let acs_credited = journal_form.querySelectorAll("input[name='journal_ac_credited']");
	let amounts = journal_form.querySelectorAll("input[name='journal_amount']");
	let descriptions = journal_form.querySelectorAll("input[name='journal_description']");
	let data = [];
	for (let i=0; i < amounts.length; i++) {
		data.push({});
		data[i].journal_date = dates[i].value;
		data[i].journal_ac_debited = acs_debited[i].value;
		data[i].journal_ac_credited = acs_credited[i].value;
		data[i].journal_amount = amounts[i].value;
		data[i].journal_description = descriptions[i].value;
	}
	fetch(`/journal/${user_token}/${uid}/${fy_id}`, {
		method: "POST",
		body: JSON.stringify(data),
		headers: {"Content-Type": "application/json"}
	})
	.then(response => response.json())
	.then(data => {
		if (data.error || (data[0] && data[0].error)) {
			errorVisible = [];
			errorTable = journal_form;
			if (data.error) data = [data];
			for (d of data) {
				let field = journal_form.querySelectorAll(`input[name="${d.field}"]`)[d.index];
				field.previousElementSibling.classList.add("on");
				field.previousElementSibling.innerText = d.error;
				errorVisible.push(d);
			}
			return resolve(false);
		} else if (data.success) {
			for (let i=0; i < amounts.length; i++) {
				journal_rows.children[i].setAttribute("id", `entry_${uid}_${journal_form.getAttribute("fy_id")}_${i}`);
			}
			fetch_ledger_menu();
			fetch_bs();
			fetch_tb();
			alert("saved");
			return resolve(true);
		}
	})
	.catch(error => {
		reject(error);
	});
});};
let import_journal = async () => {
	if (status == "locked" || user_status == "locked" || (audition && uid != audition)) { return; }
	let importer = document.getElementById("importer");
	let file = await new Promise(resolve => {
		importer.onchange = () => resolve(importer.files[0]);
		importer.click();
	});
	if (!file) return;
	let csv = await file.text();
	journal_rows.innerHTML = "";
	let rows = csv.split(/\r?\n/).filter(line => line.trim() !== "");
	for (let i=1; i < rows.length-1; i += 3) {
		if (!rows[i] || !rows[i + 1] || !rows[i + 2]) break;
		let row1 = rows[i].split(",");
		let row2 = rows[i+1].split(",");
		let row3 = rows[i+2].split(",");
		let row = {
			"journal_date": row1[0],
			"journal_ac_debited": row1[1].replace(/ A\/c Dr\.(?!.* A\/c Dr\.)/, ""),
			"journal_ac_credited": (row2[1].replace(/ A\/c(?!.* A\/c)/, "")).replace("    To ", ""),
			"journal_amount": parseInt(row1[2], 10),
			"journal_description": (row3[1].replace("(", "")).replace(")", ""),
			"journal_entry_id": (i == 1) ? 0 : i-3
		};
		journal_rows.insertAdjacentHTML("beforeend", journal_row(row));
		journal_total.innerHTML = `<div aria-label="Row: Total" class="tr">
			<div aria-label="Cell: Empty" class="td"><span></span></div>
			<div aria-label="Cell: Total Label" class="td" style="grid-column: span 2"><span>Total</span></div>
			<div aria-label="Cell: Total Amount" class="td"><span id="total_amount">${parseInt(rows[rows.length-1].split(",")[2], 10)}</span></div>
			<div aria-label="Cell: Empty" class="td"><span></span></div>
		</div>`;
	}
	update_total();
	document.getElementById("journal_action_msg").textContent = `Journal ${file.name} has been imported`;
};
let export_journal = async () => {
	let submission = (status == "locked" || user_status == "locked" || (audition && uid != audition)) ? "skip" : await submit_journal();
	if (!journal_rows.children.length || !submission) {
		return;
	}
	window.location.href = `/journal/${user_token}/${uid}/${fy_id}?download=True`;
};
let update_total = () => {
	let total = 0;
	let amounts = journal_form.querySelectorAll("input[name='journal_amount']");
	for (amount of amounts) {
		if (amount.value) {
			total += parseFloat(amount.value);
		}
	}
	document.getElementById("total_amount").value = `${total}`;
};