let to_tb = (target, side, account) => {
	if (user_status == "locked") {
		alert("Your account has been locked");
		return;
	}
	if (
		(side == "nota" && target.querySelector(".side").innerHTML == "")
		|| target.querySelector(".side").innerHTML == `(${side})`
	) {
		return;
	}
	let data = new FormData();
	data.append("side", side);
	data.append("account", account);
	fetch(`/tb/${user_token}/${uid}/${fy_id}`, {
		method: "PATCH",
		body: data
	})
	.then(response => response.json())
	.then(data => {
		if (data.error) {
			alert(data.error);
		} else if (data.success) {
			target.querySelector(".side").innerHTML = (data.side != "nota") ? `(${data.side})` : ``;
			fetch_tb();
		}
	})
	.catch(error => {alert(error);});
};
let tb = document.getElementById("tb");
let tb_table = document.getElementById("tb_table");
let fetch_tb = () => {
	let tbody = tb_table.querySelector(".tbody");
	tbody.innerHTML = "";
	fetch(`/tb/${user_token}/${uid}/${fy_id}`, {method: "GET"})
	.then(response => response.json())
	.then(data => {
		if (data.error) {
			alert(data.error);
		} else {
			let empty_row = "<div class='tr'>"+"<div class='td'><p></p></div>".repeat(3)+"</div>";
			for (let i=0; i < data.debit_side.length; i++) {
				tbody.insertAdjacentHTML("beforeend", `<div class="tr" onclick="refer_ledger('${data.debit_side[i].account}')">
					<div class="td"><p>${data.debit_side[i].account}</p></div>
					<div class="td"><p>${data.debit_side[i].balance}</p></div>
					<div class="td"><p></p></div>
				</div>`);
			}
			for (let i=0; i < data.credit_side.length; i++) {
				tbody.insertAdjacentHTML("beforeend", `<div class="tr" onclick="refer_ledger('${data.credit_side[i].account}')">
					<div class="td"><p>${data.credit_side[i].account}</p></div>
					<div class="td"><p></p></div>
					<div class="td"><p>${data.credit_side[i].balance}</p></div>
				</div>`);
			}
			tbody.insertAdjacentHTML("beforeend", empty_row+`<div class="tr">
				<div class="td"><p>Total</p></div>
				<div class="td"><p>${data.debit_total}</p></div>
				<div class="td"><p>${data.credit_total}</p></div>
			</div>`);
		}
	})
	.catch(error => {
		alert(error);
	});
};
let export_tb = async () => {
	if (!tb_table.querySelector(".tbody").children.length) {
		return;
	}
	window.location.href = `/tb/${user_token}/${uid}/${fy_id}?download=True`;
};