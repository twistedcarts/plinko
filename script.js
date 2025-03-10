const game = {
    money: 0,
    total_dropped: 0,
    price_per_ball: 0
};

setInterval(() => {
    const m_dis = document.getElementsByClassName("money_display");
    for (let i = 0; i < m_dis.length; i++) {
        m_dis[i].innerHTML = game.money;
    }
}, 300);