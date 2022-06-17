use std::collections::HashMap;
use std::io;
use std::io::Write;

#[derive(Clone, Copy, Debug, PartialEq)]
enum Player {
    X,
    O,
}

#[derive(Hash, Debug, Eq, PartialEq)]
struct Coord {
    x: usize,
    y: usize,
}

fn main() {
    // TODO: Randomise the start player.
    let mut player = Player::O;
    let mut grid = HashMap::<Coord, Player>::new();

    loop {
        for y in (1..=3) {
            let mut row = String::new();
            row.push_str("|");
            for x in (1..=3) {
                let coord = Coord { x, y };
                let coord_player = grid.get(&coord);
                match coord_player {
                    Some(Player::X) => {row.push_str("X|");},
                    Some(Player::O) => {row.push_str("O|");},
                    None => {row.push_str(" |");},
                }
            }
            println!("{}", row)
        }

        let mut input = String::new();
        print!("Enter a coordinate: ");
        io::stdout().flush().expect("Failed to flush.");

        io::stdin()
            .read_line(&mut input)
            .expect("Failed to read line.");

        let coordparts: Result<Vec<usize>, _> = input
            .trim()
            .split(',')
            .map(|n| n.parse())
            .collect();

        let (x,y) = match coordparts {
            Ok(v) if v.len() == 2 => (v[0], v[1]),
            _ => {
                println!("Invalid coordinate! Try again.");
                continue;
            }
        };

        let coord = Coord { x, y };
        println!("{coord:?}");

        grid.insert(coord, player);

        if player == Player::X {
            player = Player::O;
        } else {
            player = Player::X;
        }
    }
}

// #[cfg(test)]
// mod tests {
// #[test]
// fn it_works() {
// let result = 2 + 2;
// assert_eq!(result, 4);
// }
// }
