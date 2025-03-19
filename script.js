const game = {
    money: 150,
    total_dropped: 0,
    price_per_ball: 10,
    auto_drop: false,
    rows: 12,
    pegs: [],
    borders: [],
    multipliers: [],
    drop_in_progress: false
};

const physics = {
    gravity: 0.15,
    bounce: 0.7,
    friction: 0.99,
    peg_radius: 4,
    ball_radius: 7.5,
    random_factor: 0.3,
    border_radius: 7.5
};

function show_multiplier_notification(multiplier) {
    const notification = document.querySelector('.multiplier-notification');
    notification.textContent = `${multiplier}x`;
    notification.style.backgroundColor = get_multiplier_color(multiplier);
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 2000);
}

function update_multiplier_display(multiplier) {
    show_multiplier_notification(multiplier);
}

const plinko_grid = document.querySelector('.plinko_grid');
const rows_dropdown = document.querySelector('.rows_dropdown');
const drop_ball_btn = document.querySelector('.drop_ball_btn');
const bet_input = document.querySelector('.bet_input input');
const auto_drop_interval_input = document.querySelector('.auto_drop_interval_input');
const money_display = document.querySelector('.money_display');
const add_money_btn = document.querySelector('.add_money');
const plinko_border_left = document.querySelector('.plinko_border_left');
const plinko_border_right = document.querySelector('.plinko_border_right');
const auto_drop_btn = document.querySelector('.auto_drop_btn');
const manual_drop_btn = document.querySelector('.manual_drop_btn');
const auto_drop_interval = document.querySelector('.auto_drop_interval');

bet_input.addEventListener('input', () => {
    const bet_value = parseFloat(bet_input.value);
    if (!isNaN(bet_value) && bet_value > 0) {
        game.price_per_ball = bet_value;
    }
});

function generate_multipliers() {
    const num_multipliers = game.rows;
    const multiplier_config = {
        center: {
            value: 0.2,
            range: 1
        },
        edges: {
            value: 5,
            positions: [0, num_multipliers - 1]
        },
        values: [
            3, 3, 2, 1, 0.3, 0.2, 0.2, 0.3, 1, 2,
            3, 1, 0.3, 0.4, 0.2, 0.2, 0.4, 1, 2, 3,
            2, 1, 0.4, 0.2, 0.2, 0.2, 0.4, 1, 2, 3
        ]
    };
    game.multipliers = Array.from({ length: num_multipliers }, (_, i) => {
        if (multiplier_config.edges.positions.includes(i)) {
            return multiplier_config.edges.value;
        }
        const fixed_index = i % multiplier_config.values.length;
        return multiplier_config.values[fixed_index];
    });
}

function create_plinko_grid() {
    plinko_grid.innerHTML = '';
    game.pegs = [];
    game.borders = [plinko_border_left, plinko_border_right];
    generate_multipliers();
    
    const peg_spacing = 40;
    const start_x = plinko_grid.offsetWidth / 2;
    const start_y = 50;

    const last_row_pegs = game.rows + 2;
    const peg_grid_width = peg_spacing * (last_row_pegs - 1);
    const left_border_x = start_x - (peg_grid_width / 2) - physics.border_radius;
    const right_border_x = start_x + (peg_grid_width / 2) + physics.border_radius;
    
    plinko_border_left.style.left = `${left_border_x}px`;
    plinko_border_right.style.left = `${right_border_x}px`;
    
    for (let row = 0; row < game.rows; row++) {
        const pegs_in_row = row + 3;
        const row_x = start_x - (peg_spacing * (pegs_in_row - 1)) / 2;
        for (let col = 0; col < pegs_in_row; col++) {
            const peg = document.createElement('div');
            peg.className = 'peg';
            peg.style.left = `${row_x + col * peg_spacing}px`;
            peg.style.top = `${start_y + row * peg_spacing}px`;
            plinko_grid.appendChild(peg);
            game.pegs.push({x: row_x + col * peg_spacing, y: start_y + row * peg_spacing});
        }
    }
    
    const slot_width = 50;
    const slots_total_width = game.multipliers.length * slot_width;
    const start_slot_x = (plinko_grid.offsetWidth - slots_total_width) / 2;
    game.multipliers.forEach((mult, i) => {
        const slot = document.createElement('div');
        slot.className = 'multiplier-slot';
        slot.style.left = `${start_slot_x + i * slot_width}px`;
        slot.style.backgroundColor = get_multiplier_color(mult);
        slot.textContent = `${mult}x`;
        plinko_grid.appendChild(slot);
    });
}

function get_multiplier_color(multiplier) {
    if (multiplier >= 5) return 'rgb(37, 100, 235)';
    if (multiplier >= 2) return 'rgb(38, 197, 94)';
    return 'rgb(234, 179, 8)';
}

function drop_ball() {
    if (game.money < game.price_per_ball) return;
    
    game.money -= game.price_per_ball;
    update_money_display();
    const ball = document.createElement('div');
    ball.className = 'ball';
    plinko_grid.appendChild(ball);

    let x = plinko_grid.offsetWidth / 2 + (Math.random() - 0.5) * 40;
    let y = 0;
    let dx = (Math.random() - 0.5) * physics.random_factor;
    let dy = 0;
    let last_collision = null;

    let last_time = 0;

    function animate(timestamp) {
        if (!last_time) last_time = timestamp;
        const delta_time = (timestamp - last_time) / 16.67;
        last_time = timestamp;
        dy += physics.gravity * delta_time;
        dx *= Math.pow(physics.friction, delta_time);
        x += dx * delta_time;
        y += dy * delta_time;
        
        game.pegs.forEach(peg => {
            const distance = Math.sqrt((x - peg.x) ** 2 + (y - peg.y) ** 2);
            if (distance < physics.peg_radius + physics.ball_radius && last_collision !== peg) {
                const angle = Math.atan2(y - peg.y, x - peg.x);
                const speed = Math.sqrt(dx * dx + dy * dy);
                const bounce_speed = speed * physics.bounce;
                const random_angle = angle + (Math.random() - 0.5) * 0.25;
                dx = Math.cos(random_angle) * bounce_speed;
                dy = Math.sin(random_angle) * bounce_speed;
                last_collision = peg;
                setTimeout(() => last_collision = null, 100);
            }
        });

        const left_bound = plinko_border_left.offsetLeft + physics.border_radius;
        const right_bound = plinko_border_right.offsetLeft - physics.border_radius;
        if (x < left_bound) { 
            x = left_bound;
            dx = Math.abs(dx) * physics.bounce;
        }
        if (x > right_bound) {
            x = right_bound;
            dx = -Math.abs(dx) * physics.bounce;
        }
        
        if (y > plinko_grid.offsetHeight - physics.ball_radius) {
            const slot_width = 50;
            const total_width = game.multipliers.length * slot_width;
            const start_slot_x = (plinko_grid.offsetWidth - total_width) / 2;
            const slot_index = Math.floor((x - start_slot_x) / slot_width);
            if (slot_index >= 0 && slot_index < game.multipliers.length) {
                const multiplier = game.multipliers[slot_index];
                game.money += game.price_per_ball * multiplier;
                update_multiplier_display(multiplier);
                update_money_display();
                
                // Make multiplier slot grow temporarily with smooth transition
                const slot = document.querySelectorAll('.multiplier-slot')[slot_index];
                slot.style.transition = 'transform 0.1s ease-in-out';
                slot.style.transform = 'scale(1.3)';
                setTimeout(() => {
                    slot.style.transform = 'scale(1)';
                }, 100);
                
                ball.remove(); // Remove ball instantly upon hitting multiplier
            }
            return;
        }
        
        ball.style.left = `${x}px`;
        ball.style.top = `${y}px`;
        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
}



function update_money_display() {
    money_display.textContent = game.money.toFixed(2);
}

drop_ball_btn.addEventListener('click', drop_ball);

rows_dropdown.addEventListener('change', (e) => {
    game.rows = parseInt(e.target.value);
    create_plinko_grid();
});

add_money_btn.addEventListener('click', () => {
    game.money += 100;
    update_money_display();
});

document.querySelector('.bet-btn.half').addEventListener('click', () => {
    const current_value = parseFloat(bet_input.value) || 0;
    const new_value = current_value / 2;
    bet_input.value = Math.max(new_value, 0.01).toFixed(2);
    game.price_per_ball = parseFloat(bet_input.value);
});

document.querySelector('.bet-btn.double').addEventListener('click', () => {
    const current_value = parseFloat(bet_input.value) || 0;
    bet_input.value = (current_value * 2).toFixed(2);
    game.price_per_ball = parseFloat(bet_input.value);
});

document.querySelector('.auto_drop_btn').addEventListener('click', () => {
    game.auto_drop = true;
    if (game.auto_drop) {
        auto_drop_btn.style.backgroundColor = 'rgb(72,85,105)';
        manual_drop_btn.style.backgroundColor = 'rgb(15,23,42)';
    } else {
        auto_drop_btn.style.backgroundColor = 'rgb(15,23,42)';
        manual_drop_btn.style.backgroundColor = 'rgb(72,85,105)';

    }
});

document.querySelector('.manual_drop_btn').addEventListener('click', () => {
    game.auto_drop = false;
    if (!game.auto_drop) {
        auto_drop_btn.style.backgroundColor = 'rgb(15,23,42)';
        manual_drop_btn.style.backgroundColor = 'rgb(72,85,105)';
    } else {
        auto_drop_btn.style.backgroundColor = 'rgb(72,85,105)';
        manual_drop_btn.style.backgroundColor = 'rgb(15,23,42)';

    }
});

let drop_int;
function start_drop() {
    if (drop_int) clearInterval(drop_int);
    const int_val = parseInt(auto_drop_interval_input.querySelector('input').value);
    drop_int = setInterval(() => {
        if (game.auto_drop) {
            drop_ball_btn.style.opacity = '0.5';
            drop_ball_btn.style.pointerEvents = 'none';
            auto_drop_interval_input.style.opacity = 1;
            auto_drop_interval_input.style.pointerEvents = 'auto';
            auto_drop_interval.style.display = 'block';
            auto_drop_interval.style.pointerEvents = 'auto';
            drop_ball();
        } else {
            auto_drop_interval.style.display = 'none';
            auto_drop_interval.style.pointerEvents = 'none';
            drop_ball_btn.style.opacity = '1';
            drop_ball_btn.style.pointerEvents = 'auto';
            auto_drop_interval_input.style.opacity = 0;
            auto_drop_interval_input.style.pointerEvents = 'none';

        }
    }, int_val);
}
auto_drop_interval_input.querySelector('input').addEventListener('input', start_drop);
start_drop();

create_plinko_grid();
update_money_display();
