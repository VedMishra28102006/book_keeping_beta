let ledger_menu = document.getElementById("ledger_menu");
let ledger_list = document.getElementById("ledger_list");
let ledger_account = document.getElementById("ledger_account");
let ledger_item = (row) => {
	return `<li id="ledger_${row.id}" onclick="
		ledger_menu.style.display='none';
		ledger_account.style.display='grid';
		fetch_ledger_account('${row.account}');
	" subtype="${row.subtype}" type="${row.type}">
		<p>${row.account}</p>
		<p class="side">${(row.side) ? `(${row.side})` : ""}</p>
		<p class="type">${(row.type) ? `(${row.type})` : ""}</p>
		<p class="subtype">${(row.subtype) ? `(${row.subtype})` : ""}</p>
		<p class="operation">${(row.operation) ? `(${row.operation})` : ""}</p>
		<button onclick="
			event.stopPropagation();
			showOptions('_${row.account}');
		">&vellip;</button>
		<ul class="options" id="options_${row.account}">
			<li onclick="
				event.stopPropagation();
				this.parentNode.classList.remove('visible');
				ledger_menu.style.display='none';
				ledger_account.style.display='grid';
				fetch_ledger_account('${row.account}');
			">view</li>
			<li onclick="
				event.stopPropagation();
				this.parentNode.classList.remove('visible');
				document.getElementById('options_type_${row.account}').classList.add('visible');
			">To BS</li>
			<li onclick="
				event.stopPropagation();
				this.parentNode.classList.remove('visible');
				document.getElementById('options_tb_${row.account}').classList.add('visible');
			">To TB</li>
		</ul>
		<ul class="options" id="options_type_${row.account}">
			<li onclick="
				event.stopPropagation();
				document.getElementById('options_operation_${row.account}').setAttribute('type', 'asset');
				this.parentNode.classList.remove('visible');
				document.getElementById('options_subtype_${row.account}').classList.add('visible');
				document.getElementById('options_subtype_${row.account}').children[2].style.display = 'none';
			">asset</li>
			<li onclick="
				event.stopPropagation();
				document.getElementById('options_operation_${row.account}').setAttribute('type', 'liability');
				this.parentNode.classList.remove('visible');
				document.getElementById('options_subtype_${row.account}').classList.add('visible');
				document.getElementById('options_subtype_${row.account}').children[2].style.display = 'block';
			">liability</li>
			<li onclick="
				event.stopPropagation();
				this.parentNode.classList.remove('visible');
				to_bs(this.parentNode.parentNode, 'nota', 'nota', 'nota', '${row.account}');
				document.getElementById('options_subtype_${row.account}').children[2].style.display = 'none';
			">nota</li>
		</ul>
		<ul class="options" id="options_subtype_${row.account}">
			<li onclick="
				event.stopPropagation();
				document.getElementById('options_operation_${row.account}').setAttribute('subtype', 'current');
				this.parentNode.classList.remove('visible');
				document.getElementById('options_operation_${row.account}').classList.add('visible');
			">current</li>
			<li onclick="
				event.stopPropagation();
				document.getElementById('options_operation_${row.account}').setAttribute('subtype', 'noncurrent');
				this.parentNode.classList.remove('visible');
				document.getElementById('options_operation_${row.account}').classList.add('visible');
			">noncurrent</li>
			<li onclick="
				event.stopPropagation();
				document.getElementById('options_operation_${row.account}').setAttribute('subtype', 'equity');
				this.parentNode.classList.remove('visible');
				document.getElementById('options_operation_${row.account}').classList.add('visible');
			">equity</li>
		</ul>
		<ul class="options" id="options_operation_${row.account}">
			<li onclick="
				event.stopPropagation();
				this.parentNode.classList.remove('visible');
				to_bs(this.parentNode.parentNode, this.parentNode.getAttribute('type'), this.parentNode.getAttribute('subtype'), 'add', '${row.account}');
			">add</li>
			<li onclick="
				event.stopPropagation();
				this.parentNode.classList.remove('visible');
				to_bs(this.parentNode.parentNode, this.parentNode.getAttribute('type'), this.parentNode.getAttribute('subtype'), 'less', '${row.account}');
			">less</li>
		</ul>
		<ul class="options" id="options_tb_${row.account}">
			<li onclick="
				event.stopPropagation();
				this.parentNode.classList.remove('visible');
				to_tb(this.parentNode.parentNode, 'debit', '${row.account}');
			">debit</li>
			<li onclick="
				event.stopPropagation();
				this.parentNode.classList.remove('visible');
				to_tb(this.parentNode.parentNode, 'credit', '${row.account}');
			">credit</li>
			<li onclick="
				event.stopPropagation();
				this.parentNode.classList.remove('visible');
				to_tb(this.parentNode.parentNode, 'nota', '${row.account}');
			">nota</li>
		</ul>
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
				ledger_account.style.display = "none";
				ledger_menu.style.display = "block";
				ledger_table.setAttribute("account", "");
			} else {
				alert(data.error);
			}
		} else {
			ledger_table.setAttribute("account", account);
			if (!data.debit_side) {
				data.debit_side = [];
			}
			if (!data.credit_side) {
				data.credit_side = [];
			}
			let tbody = ledger_table.querySelector(".tbody");
			for (let i=0; i < Math.max(data.debit_side.length, data.credit_side.length); i++) {
				tbody.insertAdjacentHTML("beforeend", `<div class="tr">
					<div class="td" onclick="${data.debit_side[i] ? `refer_journal(${data.debit_side[i].id})` : ""}"><p>${data.debit_side[i] ? data.debit_side[i].date : ""}</p></div>
					<div class="td" onclick="${data.debit_side[i] ? `refer_journal(${data.debit_side[i].id})` : ""}"><p>${data.debit_side[i] ? data.debit_side[i].account : ""}</p></div>
					<div class="td" onclick="${data.debit_side[i] ? `refer_journal(${data.debit_side[i].id})` : ""}"><p>${data.debit_side[i] ? data.debit_side[i].amount : ""}</p></div>
					<div class="td" onclick="${data.credit_side[i] ? `refer_journal(${data.credit_side[i].id})` : ""}"><p>${data.credit_side[i] ? data.credit_side[i].date : ""}</p></div>
					<div class="td" onclick="${data.credit_side[i] ? `refer_journal(${data.credit_side[i].id})` : ""}"><p>${data.credit_side[i] ? data.credit_side[i].account : ""}</p></div>
					<div class="td" onclick="${data.credit_side[i] ? `refer_journal(${data.credit_side[i].id})` : ""}"><p>${data.credit_side[i] ? data.credit_side[i].amount : ""}</p></div>
				</div>`);
			}
			if (data.balance_side) {
				let replacee = "<div class='td'><p></p></div>".repeat(3);
				replacee += `${data.balance_side == "debit_side" ? "<div class='td'>" : "</div>"}`;
				let balance_row = `
					<div class="td"><p></p></div>
					<div class="td"><p>Balance c/d</p></div>
					<div class="td"><p>${data.balance}</p></div>
				`;
				tbody.innerHTML = tbody.innerHTML.replaceAll("\t", "").replaceAll("\r", "").replaceAll("\n", "");
				if (tbody.innerHTML.includes(replacee)) {
					balance_row += data.balance_side == "debit_side" ? "<div class='td'>" : "</div>";
					tbody.innerHTML = tbody.innerHTML.replace(replacee, balance_row);
				} else {
					let empties = "<div class='td'><p></p></div>".repeat(3);
					balance_row = data.balance_side == "debit_side" ? balance_row + empties : empties + balance_row;
					balance_row = `<div class="tr">${balance_row}</div>`;
					tbody.insertAdjacentHTML("beforeend", balance_row);
				}
			}
			let empty_row = "<div class='tr'>"+"<div class='td'><p></p></div>".repeat(6)+"</div>";
			tbody.insertAdjacentHTML("beforeend", empty_row+"<div class='tr'>"+`
				<div class="td"><p></p></div>
				<div class="td"><p></p></div>
				<div class="td"><p>${data.total}</p></div>
			`.repeat(2)+"</div>");
		}
	})
	.catch(error => {alert(error);});
};
let export_ledger = async () => {
	window.location.href = `/ledger/${user_token}/${uid}/${fy_id}?account=${ledger_table.getAttribute("account")}&download=True`;
};
let export_all_ledgers = async () => {
	window.location.href = `/ledger/${user_token}/${uid}/${fy_id}?download=True`;
};
let refer_ledger = (account) => {
	window.location.href = "#ledger_account";
	fetch_ledger_account(account);
};