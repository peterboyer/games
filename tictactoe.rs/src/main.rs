use rand::Rng;
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

struct Game {
    player: Player,
    grid: HashMap<Coord, Player>,
}

struct GameOptions {
    initial_player: Option<Player>,
}

impl Default for GameOptions {
    fn default() -> Self {
        GameOptions {
            initial_player: None,
        }
    }
}

#[derive(Debug)]
enum GameError {
    CoordOccupied,
}

impl Game {
    fn new() -> Self {
        Game::new_with(GameOptions::default())
    }

    fn new_with(options: GameOptions) -> Self {
        Game {
            player: options
                .initial_player
                .unwrap_or_else(|| match rand::thread_rng().gen() {
                    true => Player::X,
                    false => Player::O,
                }),
            grid: HashMap::new(),
        }
    }

    fn draw(&self) {
        let grid = &self.grid;
        for y in 1..=3 {
            let mut row = String::new();
            row.push_str("|");
            for x in 1..=3 {
                let coord = Coord { x, y };
                let coord_player = grid.get(&coord);
                match coord_player {
                    Some(Player::X) => {
                        row.push_str("X|");
                    }
                    Some(Player::O) => {
                        row.push_str("O|");
                    }
                    None => {
                        row.push_str(" |");
                    }
                }
            }
            println!("{}", row)
        }
    }

    fn next(&mut self, coord: Coord) -> Result<(), GameError> {
        let (player, grid) = (self.player, &mut self.grid);

        match grid.get(&coord) {
            Some(_) => {
                return Result::Err(GameError::CoordOccupied);
            }
            _ => (),
        }

        grid.insert(coord, player);

        if player == Player::X {
            self.player = Player::O;
        } else {
            self.player = Player::X;
        }

        return Result::Ok(());
    }
}

fn main() {
    let mut game = Game::new();

    loop {
        game.draw();
        println!("Current Player: {:?}", game.player);

        let mut input = String::new();
        print!("Enter a coordinate: ");
        io::stdout().flush().expect("Failed to flush.");

        io::stdin()
            .read_line(&mut input)
            .expect("Failed to read line.");

        let coordparts: Result<Vec<usize>, _> =
            input.trim().split(',').map(|n| n.parse()).collect();

        let (x, y) = match coordparts {
            Ok(v) if v.len() == 2 => (v[0], v[1]),
            _ => {
                println!("Invalid coordinate! Try again.");
                continue;
            }
        };

        let coord = Coord { x, y };
        match game.next(coord) {
            Err(GameError::CoordOccupied) => {
                println!("Coordinate already occupied! Try again.");
                continue;
            }
            // Err(err) => {
            // println!("Failed: {:?}. Try again.", err);
            // continue;
            // }
            _ => (),
        }
    }
}

#[cfg(test)]
mod tests {
    use crate::*;

    #[test]
    fn it_should_put_x_in_1_1() {
        let mut game = Game::new_with(GameOptions {
            initial_player: Some(Player::X),
            ..Default::default()
        });
        game.next(Coord { x: 1, y: 1 }).unwrap();
        assert!(game.grid.get(&Coord { x: 1, y: 1 }).unwrap() == &Player::X);
    }

    #[test]
    fn it_should_change_player_after_valid_turn() {
        let mut game = Game::new_with(GameOptions {
            initial_player: Some(Player::X),
            ..Default::default()
        });
        game.next(Coord { x: 1, y: 1 }).unwrap();
        assert!(game.player == Player::O);
    }

    #[test]
    fn it_should_not_change_player_if_invalid_turn() {
        let mut game = Game::new_with(GameOptions {
            initial_player: Some(Player::X),
            ..Default::default()
        });
        game.next(Coord { x: 1, y: 1 }).unwrap();
        assert!(game.next(Coord { x: 1, y: 1 }).is_err());
    }
}
