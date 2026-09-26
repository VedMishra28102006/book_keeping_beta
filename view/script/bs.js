let to_bs = (target, type, subtype, operation, account) => {
	if (user_status == "locked") {
		alert("Your account has been locked");
		return;
	}
	if (
		target.querySelector(".operation").innerHTML == `(${operation})`
		&& target.querySelector(".type").innerHTML == `(${type})`
		&& target.querySelector(".subtype").innerHTML == `(${subtype})`
	) {
		return;
	}
	let data = new FormData();
	data.append("type", type);
	data.append("subtype", subtype);
	data.append("operation", operation);
	data.append("account", account);
	fetch(`/bs/${user_token}/${uid}/${fy_id}`, {
		method: "PATCH",
		body: data
	})
	.then(response => response.json())
	.then(data => {
		if (data.error) {
			alert(data.error);
		} else if (data.success) {
			target.querySelector(".operation").innerHTML = (data.type != "nota") ? `(${data.operation})` : ``;
			target.querySelector(".type").innerHTML = (data.type != "nota") ? `(${data.type})` : ``;
			target.querySelector(".subtype").innerHTML = (data.type != "nota") ? `(${data.subtype})` : ``;
			fetch_bs();
		}
	})
	.catch(error => {alert(error);});
};
let bs = document.getElementById("bs");
let bs_table = document.getElementById("bs_table");
let fetch_bs = () => {
	bs_table.querySelector(".tbody").innerHTML = "";
	fetch(`/bs/${user_token}/${uid}/${fy_id}`, {method: "GET"})
	.then(response => response.json())
	.then(data => {
		if (data.error) {
			alert(data.error);
		} else {
			let tbody = bs_table.querySelector(".tbody");
			tbody.insertAdjacentHTML("beforeend", `<div class="tr">
				<div class="td" style="grid-column: span 2"><p>Current Assets:</p></div>
				<div class="td" style="grid-column: span 2"><p>Current Liabilities:</p></div>
			</div>`);
			let empty_row = "<div class='tr'>"+"<div class='td'><p></p></div>".repeat(4)+"</div>";
			for (let i=0; i < Math.max(data.assets.current.length, data.liabilities.current.length); i++) {
				tbody.insertAdjacentHTML("beforeend", `<div class="tr">
					<div class="td" onclick="${data.assets.current[i] ? `refer_ledger('${data.assets.current[i].account}')` : ""}"><p>${data.assets.current[i] ? data.assets.current[i].account : ""}</p></div>
					<div class="td" onclick="${data.assets.current[i] ? `refer_ledger('${data.assets.current[i].account}')` : ""}"><p>${data.assets.current[i] ? ((data.assets.current[i].operation == "add") ? data.assets.current[i].amount : `(${data.assets.current[i].amount})`) : ""}</p></div>
					<div class="td" onclick="${data.liabilities.current[i] ? `refer_ledger('${data.liabilities.current[i].account}')` : ""}"><p>${data.liabilities.current[i] ? data.liabilities.current[i].account : ""}</p></div>
					<div class="td" onclick="${data.liabilities.current[i] ? `refer_ledger('${data.liabilities.current[i].account}')` : ""}"><p>${data.liabilities.current[i] ? ((data.liabilities.current[i].operation == "add") ? data.liabilities.current[i].amount : `(${data.liabilities.current[i].amount})`): ""}</p></div>
				</div>`);
			}
			tbody.insertAdjacentHTML("beforeend", empty_row+`<div class="tr">
				<div class="td"><p>Total current assets</p></div>
				<div class="td"><p>${(data.assets.current_total >= 0) ? data.assets.current_total : `(${Math.abs(data.assets.current_total)})`}</p></div>
				<div class="td"><p>Total current liabilities</p></div>
				<div class="td"><p>${(data.liabilities.current_total >= 0) ? data.liabilities.current_total : `(${Math.abs(data.liabilities.current_total)})`}</p></div>
			</div>`+empty_row);
			tbody.insertAdjacentHTML("beforeend", `<div class="tr">
				<div class="td" style="grid-column: span 2"><p>Non-Current Assets:</p></div>
				<div class="td" style="grid-column: span 2"><p>Non-Current Liabilities:</p></div>
			</div>`);
			for (let i=0; i < Math.max(data.assets.noncurrent.length, data.liabilities.noncurrent.length); i++) {
				tbody.insertAdjacentHTML("beforeend", `<div class="tr">
					<div class="td" onclick="${data.assets.noncurrent[i] ? `refer_ledger('${data.assets.noncurrent[i].account}')` : ""}"><p>${data.assets.noncurrent[i] ? data.assets.noncurrent[i].account : ""}</p></div>
					<div class="td" onclick="${data.assets.noncurrent[i] ? `refer_ledger('${data.assets.noncurrent[i].account}')` : ""}"><p>${data.assets.noncurrent[i] ? ((data.assets.noncurrent[i].operation == "add") ? data.assets.noncurrent[i].amount : `(${data.assets.noncurrent[i].amount})`) : ""}</p></div>
					<div class="td" onclick="${data.liabilities.noncurrent[i] ? `refer_ledger('${data.liabilities.noncurrent[i].account}')` : ""}"><p>${data.liabilities.noncurrent[i] ? data.liabilities.noncurrent[i].account : ""}</p></div>
					<div class="td" onclick="${data.liabilities.noncurrent[i] ? `refer_ledger('${data.liabilities.noncurrent[i].account}')` : ""}"><p>${data.liabilities.noncurrent[i] ? ((data.liabilities.noncurrent[i].operation == "add") ? data.liabilities.noncurrent[i].amount : `(${data.liabilities.noncurrent[i].amount})`) : ""}</p></div>
				</div>`);
			}
			tbody.insertAdjacentHTML("beforeend", empty_row+`<div class="tr">
				<div class="td"><p>Total non-current assets</p></div>
				<div class="td"><p>${(data.assets.noncurrent_total >= 0) ? data.assets.noncurrent_total : `(${Math.abs(data.assets.noncurrent_total)})`}</p></div>
				<div class="td"><p>Total non-current liabilities</p></div>
				<div class="td"><p>${(data.liabilities.noncurrent_total >= 0) ? data.liabilities.noncurrent_total : `(${Math.abs(data.liabilities.noncurrent_total)})`}</p></div>
			</div>`+empty_row);
			tbody.insertAdjacentHTML("beforeend", `<div class="tr">
				<div class="td" style="grid-column: span 2"><p></p></div>
				<div class="td" style="grid-column: span 2"><p>Shareholders' Equity:</p></div>
			</div>`);
			for (let i=0; i < data.liabilities.equity.length; i++) {
				tbody.insertAdjacentHTML("beforeend", `<div class="tr">
					<div class="td" style="grid-column: span 2"><p></p></div>
					<div class="td" onclick="${data.liabilities.equity[i] ? `refer_ledger('${data.liabilities.equity[i].account}')` : ""}"><p>${data.liabilities.equity[i] ? data.liabilities.equity[i].account : ""}</p></div>
					<div class="td" onclick="${data.liabilities.equity[i] ? `refer_ledger('${data.liabilities.equity[i].account}')` : ""}"><p>${data.liabilities.equity[i] ? ((data.liabilities.equity[i].operation == "add") ? data.liabilities.equity[i].amount : `(${data.liabilities.equity[i].amount})`) : ""}</p></div>
				</div>`);
			}
			tbody.insertAdjacentHTML("beforeend", empty_row+`<div class="tr">
				<div class="td" style="grid-column: span 2"><p></p></div>
				<div class="td"><p>Total shareholders' equity</p></div>
				<div class="td"><p>${(data.liabilities.equity_total >= 0) ? data.liabilities.equity_total : `(${Math.abs(data.liabilities.equity_total)})` }</p></div>
			</div>`+empty_row);
			tbody.insertAdjacentHTML("beforeend", `<div class="tr">
				<div class="td"><p>Total assets</p></div>
				<div class="td"><p>${(data.assets.total >= 0) ? data.assets.total : `(${Math.abs(data.assets.total)})` }</p></div>
				<div class="td"><p>Total liabilities</p></div>
				<div class="td"><p>${(data.liabilities.total >= 0) ? data.liabilities.total : `(${Math.abs(data.liabilities.total)})`}</p></div>
			</div>`);
		}
	})
	.catch(error => {
		alert(error);
	});
};
let export_bs = async () => {
	if (!bs_table.querySelector(".tbody").children.length) {
		return;
	}
	window.location.href = `/bs/${user_token}/${uid}/${fy_id}?download=True`;
};